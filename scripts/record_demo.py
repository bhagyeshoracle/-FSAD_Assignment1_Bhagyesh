import datetime
import os
import subprocess
import sys
import threading
import time
from urllib.request import urlopen

import cv2
import numpy as np
from mss import MSS
from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from playwright.sync_api import sync_playwright
import pygetwindow as gw

WORKSPACE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUTPUT_DIR = os.path.join(WORKSPACE, "recordings")
CODE_CMD = r"D:\Softwares\Microsoft VS Code\bin\code.cmd"
BASE_URL = "http://localhost:5173"
GATEWAY_HEALTH = "http://localhost:4000/health"


class ScreenRecorder:
    def __init__(self, output_path, fps=10, target_size=(1366, 854)):
        self.output_path = output_path
        self.fps = fps
        self.target_w, self.target_h = target_size
        self.running = False
        self.step_text = "Starting recording..."
        self.lock = threading.Lock()
        self.thread = None

    def set_step(self, text):
        with self.lock:
            self.step_text = text

    def start(self):
        self.running = True
        self.thread = threading.Thread(target=self._capture_loop, daemon=True)
        self.thread.start()

    def stop(self):
        self.running = False
        if self.thread:
            self.thread.join(timeout=5)

    def _capture_loop(self):
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        writer = cv2.VideoWriter(self.output_path, fourcc, self.fps, (self.target_w, self.target_h))
        start_time = time.time()

        with MSS() as sct:
            monitor = sct.monitors[1]
            while self.running:
                frame = np.array(sct.grab(monitor))[:, :, :3]
                frame = cv2.resize(frame, (self.target_w, self.target_h), interpolation=cv2.INTER_AREA)

                elapsed = int(time.time() - start_time)
                mins = elapsed // 60
                secs = elapsed % 60

                with self.lock:
                    step = self.step_text

                cv2.rectangle(frame, (0, 0), (self.target_w, 62), (20, 20, 20), -1)
                cv2.putText(
                    frame,
                    f"FSAD Assignment Demo Recording   {mins:02d}:{secs:02d}",
                    (16, 26),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6,
                    (255, 255, 255),
                    1,
                    cv2.LINE_AA,
                )
                cv2.putText(
                    frame,
                    step,
                    (16, 50),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.5,
                    (190, 255, 230),
                    1,
                    cv2.LINE_AA,
                )

                writer.write(frame)
                time.sleep(1 / self.fps)

        writer.release()


def run_powershell(command):
    return subprocess.run(
        ["powershell", "-NoProfile", "-Command", command],
        capture_output=True,
        text=True,
        check=False,
    )


def kill_existing_ports():
    cmd = (
        "Get-NetTCPConnection -LocalPort 5173,4000,4001,4002,4003 -State Listen "
        "-ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | "
        "ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }"
    )
    run_powershell(cmd)


def reset_demo_data():
    subprocess.run(
        ["node", os.path.join(WORKSPACE, "backend", "shared", "resetDemoData.js")],
        check=False,
        capture_output=True,
        text=True,
    )


def wait_for_service(url, timeout_sec=90):
    start = time.time()
    while time.time() - start < timeout_sec:
        try:
            with urlopen(url, timeout=3) as response:
                if response.status == 200:
                    return True
        except Exception:
            pass
        time.sleep(2)
    return False


def sleep_with_step(recorder, step, seconds):
    recorder.set_step(step)
    for _ in range(seconds):
        time.sleep(1)


def find_window_by_keywords(keywords, timeout_sec=20):
    if isinstance(keywords, str):
        keywords = [keywords]

    end = time.time() + timeout_sec
    while time.time() < end:
        for title in gw.getAllTitles():
            lowered = title.lower()
            if any(keyword.lower() in lowered for keyword in keywords):
                windows = gw.getWindowsWithTitle(title)
                if windows:
                    return windows[0]
        time.sleep(0.4)
    return None


def activate_and_maximize_window(keywords, timeout_sec=12):
    window = find_window_by_keywords(keywords, timeout_sec=timeout_sec)
    if not window:
        return False
    try:
        window.activate()
        time.sleep(0.5)
    except Exception:
        pass
    try:
        window.maximize()
    except Exception:
        pass
    return True


def clear_and_type(locator, text, delay_ms=110):
    locator.click()
    locator.press("ControlOrMeta+A")
    locator.press("Backspace")
    locator.type(text, delay=delay_ms)


def set_control_value(locator, value):
    locator.fill("")
    locator.fill(str(value))


def wait_for_visible(locator, timeout_ms=8000):
    try:
        locator.first.wait_for(state="visible", timeout=timeout_ms)
        return True
    except Exception:
        return False


def my_requests_has_data(page):
    no_requests = page.locator("text=No borrow requests yet.")
    return not (no_requests.count() > 0 and no_requests.first.is_visible())


def open_dev_terminal_and_run(recorder):
    recorder.set_step("Opening terminal and running: cd <project> then npm start")
    dev_process = subprocess.Popen(
        [
            "cmd",
            "/K",
            f'cd /d "{WORKSPACE}" && npm start',
        ],
        creationflags=subprocess.CREATE_NEW_CONSOLE,
    )
    sleep_with_step(recorder, "Terminal command entered. Services booting...", 16)

    recorder.set_step("Minimizing terminal so application remains clearly visible")
    terminal = find_window_by_keywords(["cmd", "command prompt"], timeout_sec=12)
    if terminal:
        try:
            terminal.minimize()
        except Exception:
            pass
    time.sleep(2)
    return dev_process


def login(page, email, password):
    page.goto(f"{BASE_URL}/login", wait_until="domcontentloaded")
    page.wait_for_timeout(1500)
    clear_and_type(page.get_by_label("Email"), email, delay_ms=110)
    page.wait_for_timeout(500)
    clear_and_type(page.get_by_label("Password"), password, delay_ms=110)
    page.wait_for_timeout(600)
    page.get_by_role("button", name="Login").click()
    page.wait_for_timeout(3500)


def logout(page):
    page.get_by_role("button", name="Logout").click()
    page.wait_for_timeout(2000)


def student_flow(page, recorder):
    recorder.set_step("Student flow: dashboard, search/filter, and request")
    login(page, "student@school.edu", "password123")
    page.wait_for_timeout(4500)

    recorder.set_step("Student flow: searching equipment")
    clear_and_type(page.get_by_placeholder("Search by item name or description"), "camera", delay_ms=120)
    page.wait_for_timeout(700)
    page.get_by_role("button", name="Apply").click()
    page.wait_for_timeout(4500)

    recorder.set_step("Student flow: clearing search and showing full listing")
    clear_and_type(page.get_by_placeholder("Search by item name or description"), "", delay_ms=90)
    page.wait_for_timeout(700)
    page.get_by_role("button", name="Apply").click()
    page.wait_for_timeout(4500)

    recorder.set_step("Student flow: opening borrow request form")
    arduino_row = page.locator("tr", has_text="Arduino Starter Box").first
    arduino_row.get_by_role("button", name="Request").click()
    page.wait_for_timeout(2500)

    request_box = page.locator(".request-box").first
    request_box.scroll_into_view_if_needed()
    page.wait_for_timeout(1200)

    borrow_start = (
        datetime.date.today() + datetime.timedelta(days=30 + int(time.time()) % 20)
    ).isoformat()
    borrow_end = (
        datetime.date.fromisoformat(borrow_start) + datetime.timedelta(days=1)
    ).isoformat()

    recorder.set_step("Student flow: submitting valid borrow request")
    set_control_value(request_box.get_by_label("Quantity"), "1")
    page.wait_for_timeout(500)
    set_control_value(request_box.get_by_label("Start date"), borrow_start)
    page.wait_for_timeout(300)
    set_control_value(request_box.get_by_label("End date"), borrow_end)
    page.wait_for_timeout(300)
    clear_and_type(
        request_box.get_by_label("Remarks"),
        "Demo request for assignment video",
        delay_ms=95,
    )
    page.wait_for_timeout(700)
    request_box.get_by_role("button", name="Submit Request").click()
    page.wait_for_timeout(4500)
    recorder.set_step("Student flow: checking My Requests status")
    page.get_by_role("link", name="My Requests").click()
    page.wait_for_timeout(9000)

    if not my_requests_has_data(page):
        # Retry once if the first submit did not register due transient UI timing.
        page.get_by_role("link", name="Equipment").click()
        page.wait_for_timeout(2200)
        arduino_row = page.locator("tr", has_text="Arduino Starter Box").first
        arduino_row.get_by_role("button", name="Request").click()
        page.wait_for_timeout(1800)
        request_box = page.locator(".request-box").first
        request_box.scroll_into_view_if_needed()
        set_control_value(request_box.get_by_label("Quantity"), "1")
        set_control_value(request_box.get_by_label("Start date"), borrow_start)
        set_control_value(request_box.get_by_label("End date"), borrow_end)
        request_box.get_by_role("button", name="Submit Request").click()
        page.wait_for_timeout(4500)
        page.get_by_role("link", name="My Requests").click()
        page.wait_for_timeout(5000)

    if not my_requests_has_data(page):
        raise RuntimeError("My Requests is empty after submission.")

    logout(page)
    page.wait_for_timeout(2500)


def staff_flow(page, recorder):
    recorder.set_step("Staff flow: approving and returning request")
    login(page, "staff@school.edu", "password123")
    page.wait_for_timeout(3000)
    page.get_by_role("link", name="Approvals").click()
    page.wait_for_timeout(5500)

    approve_btn = page.get_by_role("button", name="Approve")
    if not wait_for_visible(approve_btn, 8000):
        page.get_by_label("Filter by status").select_option("PENDING")
        page.wait_for_timeout(3000)
        approve_btn = page.get_by_role("button", name="Approve")
    if not wait_for_visible(approve_btn, 8000):
        raise RuntimeError("No pending request found in Approval Queue.")
    approve_btn.first.click()
    page.wait_for_timeout(6000)

    return_btn = page.get_by_role("button", name="Return")
    if return_btn.count() > 0:
        return_btn.first.click()
        page.wait_for_timeout(6000)

    page.wait_for_timeout(6000)
    logout(page)
    page.wait_for_timeout(2500)


def admin_flow(page, recorder):
    recorder.set_step("Admin flow: add, edit, and delete equipment")
    login(page, "admin@school.edu", "password123")
    page.wait_for_timeout(3500)
    page.get_by_role("link", name="Manage Equipment").click()
    page.wait_for_timeout(5500)

    unique_name = f"Video Demo Item {int(time.time())}"

    clear_and_type(page.get_by_label("Name"), unique_name, delay_ms=95)
    page.wait_for_timeout(500)
    clear_and_type(page.get_by_label("Category"), "Demo", delay_ms=110)
    page.wait_for_timeout(500)
    clear_and_type(page.get_by_label("Total quantity"), "2", delay_ms=150)
    page.wait_for_timeout(500)
    clear_and_type(
        page.get_by_label("Description"),
        "Temporary item added during recorded demo.",
        delay_ms=90,
    )
    page.wait_for_timeout(900)
    page.get_by_role("button", name="Add Equipment").click()
    page.wait_for_timeout(6500)

    row = page.locator("tr", has_text=unique_name).first
    if row.count() > 0:
        row.get_by_role("button", name="Edit").click()
        page.wait_for_timeout(2500)
        clear_and_type(page.get_by_label("Total quantity"), "3", delay_ms=150)
        page.wait_for_timeout(800)
        page.get_by_role("button", name="Update Equipment").click()
        page.wait_for_timeout(5000)

        row = page.locator("tr", has_text=unique_name).first
        if row.count() > 0:
            row.get_by_role("button", name="Delete").click()
            page.wait_for_timeout(6000)

    page.wait_for_timeout(7000)
    logout(page)
    page.wait_for_timeout(2500)


def architecture_check(page, recorder):
    recorder.set_step("Integration check: API gateway health endpoint")
    page.goto(GATEWAY_HEALTH, wait_until="domcontentloaded")
    page.wait_for_timeout(10000)


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    output_path = os.path.join(OUTPUT_DIR, f"assignment_demo_{timestamp}.mp4")
    script_start = time.time()
    target_duration_sec = int(os.getenv("DEMO_TARGET_DURATION_SEC", "400"))

    print("Preparing environment...")
    kill_existing_ports()
    reset_demo_data()

    recorder = ScreenRecorder(output_path=output_path, fps=10)
    recorder.start()

    dev_process = None
    browser = None

    try:
        sleep_with_step(recorder, "Opening VS Code workspace", 2)
        subprocess.Popen([CODE_CMD, "--new-window", WORKSPACE], shell=False)
        sleep_with_step(recorder, "VS Code opened with project files", 20)

        dev_process = open_dev_terminal_and_run(recorder)

        recorder.set_step("Waiting for API gateway and frontend to become available")
        gateway_ok = wait_for_service(GATEWAY_HEALTH, timeout_sec=90)
        frontend_ok = wait_for_service(BASE_URL, timeout_sec=90)
        if not gateway_ok or not frontend_ok:
            raise RuntimeError("Services did not start in time. Please rerun script.")

        sleep_with_step(recorder, "Services are ready. Launching browser demo...", 8)

        with sync_playwright() as p:
            demo_completed = False

            for attempt in range(1, 4):
                context = None
                browser = None
                try:
                    recorder.set_step(f"Launching Chrome for demo run (attempt {attempt}/3)")
                    browser = p.chromium.launch(
                        channel="chrome",
                        headless=False,
                        slow_mo=280,
                        args=["--start-maximized"],
                    )
                    context = browser.new_context(no_viewport=True)
                    page = context.new_page()
                    activate_and_maximize_window(["chrome"], timeout_sec=10)

                    student_flow(page, recorder)
                    sleep_with_step(recorder, "Pausing on student summary screen", 14)

                    staff_flow(page, recorder)
                    sleep_with_step(recorder, "Pausing on staff summary screen", 14)

                    admin_flow(page, recorder)
                    sleep_with_step(recorder, "Pausing on admin summary screen", 14)

                    architecture_check(page, recorder)
                    sleep_with_step(recorder, "Final walkthrough and wrap-up", 30)

                    elapsed = time.time() - script_start
                    if elapsed < target_duration_sec:
                        remaining = int(target_duration_sec - elapsed)
                        sleep_with_step(
                            recorder,
                            "Keeping browser open while final recording duration completes",
                            remaining,
                        )

                    demo_completed = True
                    break
                except Exception as flow_error:
                    print(f"Browser flow attempt {attempt} failed: {flow_error}")
                    recorder.set_step(
                        f"Transient browser issue on attempt {attempt}; relaunching shortly"
                    )
                    time.sleep(5)
                finally:
                    if context:
                        try:
                            context.close()
                        except Exception:
                            pass
                    if browser:
                        try:
                            browser.close()
                        except Exception:
                            pass

            if not demo_completed:
                raise RuntimeError("Browser automation failed after 3 attempts.")

    except PlaywrightTimeoutError as error:
        recorder.set_step("Automation timeout. Finishing recording with error message.")
        print(f"Playwright timeout: {error}")
        time.sleep(6)
    except Exception as error:
        recorder.set_step("Error occurred during recording. Saving partial video.")
        print(f"Error: {error}")
        time.sleep(6)
    finally:
        if browser:
            try:
                browser.close()
            except Exception:
                pass

        if dev_process and dev_process.poll() is None:
            subprocess.run(["taskkill", "/PID", str(dev_process.pid), "/T", "/F"], check=False)

        sleep_with_step(recorder, "Stopping recording and writing video file...", 2)
        recorder.stop()
        print(f"Video saved: {output_path}")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("Recording interrupted by user.")
        sys.exit(1)
