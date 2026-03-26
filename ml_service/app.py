from __future__ import annotations

import json
import os
from dataclasses import dataclass
from datetime import date, datetime
from http.server import BaseHTTPRequestHandler, HTTPServer
from typing import Any


def clamp(value: float, minimum: float = 0.0, maximum: float = 1.0) -> float:
    return max(minimum, min(maximum, value))


def normalize_driver_name(value: Any) -> str:
    return str(value or "").strip().lower()


def parse_experience_years(value: Any) -> float:
    text = str(value or "")
    number = ""
    dot_seen = False
    for char in text:
        if char.isdigit():
            number += char
        elif char == "." and not dot_seen:
            number += char
            dot_seen = True
        elif number:
            break
    if not number:
        return 0.0
    try:
        return float(number)
    except ValueError:
        return 0.0


def to_date_only(value: Any) -> str:
    if not value:
        return date.today().isoformat()
    text = str(value)
    if "T" in text:
        return text.split("T", 1)[0]
    if " " in text:
        return text.split(" ", 1)[0]
    return text[:10]


@dataclass
class DriverPerformanceInput:
    drivers: list[dict[str, Any]]
    attendance: list[dict[str, Any]]
    entry_exit_logs: list[dict[str, Any]]
    lookback_days: int


def build_driver_feature(
    driver: dict[str, Any],
    attendance_rows: list[dict[str, Any]],
    entry_exit_rows: list[dict[str, Any]],
    max_trips: int,
    lookback_days: int,
) -> dict[str, Any]:
    relevant_attendance = [
        row
        for row in attendance_rows
        if str(row.get("subjectType", "")).lower() == "driver"
        and str(row.get("subjectId", "")) == str(driver.get("driverId", ""))
    ]

    present_count = sum(1 for row in relevant_attendance if row.get("status") == "Present")
    absent_count = sum(1 for row in relevant_attendance if row.get("status") == "Absent")
    leave_count = sum(1 for row in relevant_attendance if row.get("status") == "Leave")
    total_attendance = len(relevant_attendance)

    reliability_rate = present_count / total_attendance if total_attendance else 0.5
    absence_rate = absent_count / total_attendance if total_attendance else 0.25

    normalized_name = normalize_driver_name(driver.get("driverName"))
    driver_trips = [
        row for row in entry_exit_rows if normalize_driver_name(row.get("driverName")) == normalized_name
    ]
    trips_count = len(driver_trips)
    avg_trips_per_day = trips_count / max(1, lookback_days)
    load_score = 1 - (trips_count / max_trips) if max_trips > 0 else 1

    assigned_bus_hits = sum(
        1 for row in driver_trips if str(row.get("busNumber", "")) == str(driver.get("assignedBus", ""))
    )
    bus_familiarity = assigned_bus_hits / trips_count if trips_count else 0

    experience_years = parse_experience_years(driver.get("experience"))
    experience_score = clamp(experience_years / 10)
    status = driver.get("status")
    availability_score = 1 if status == "Active" else 0.35 if status == "Inactive" else 0.1

    predicted_reliability = clamp(
        reliability_rate * 0.45
        + availability_score * 0.2
        + experience_score * 0.15
        + load_score * 0.1
        + bus_familiarity * 0.1
    )

    confidence = clamp(total_attendance / 12) * 0.6 + clamp(trips_count / 20) * 0.4

    if status != "Active" or predicted_reliability < 0.55 or absence_rate > 0.35:
        predicted_risk = "High"
    elif predicted_reliability < 0.75:
        predicted_risk = "Medium"
    else:
        predicted_risk = "Low"

    return {
        "driverId": driver.get("id"),
        "driverCode": driver.get("driverId"),
        "driverName": driver.get("driverName"),
        "assignedBus": driver.get("assignedBus"),
        "status": status,
        "metrics": {
            "presentCount": present_count,
            "absentCount": absent_count,
            "leaveCount": leave_count,
            "totalAttendance": total_attendance,
            "reliabilityRate": round(reliability_rate, 3),
            "absenceRate": round(absence_rate, 3),
            "tripsCount": trips_count,
            "avgTripsPerDay": round(avg_trips_per_day, 3),
            "experienceYears": round(experience_years, 2),
            "confidence": round(confidence, 3),
        },
        "predictedReliability": round(predicted_reliability, 3),
        "predictedRisk": predicted_risk,
    }


def calculate_driver_performance(payload: DriverPerformanceInput) -> list[dict[str, Any]]:
    trip_map: dict[str, int] = {}
    for row in payload.entry_exit_logs:
        key = normalize_driver_name(row.get("driverName"))
        trip_map[key] = trip_map.get(key, 0) + 1
    max_trips = max(trip_map.values()) if trip_map else 0

    features = [
        build_driver_feature(
            driver=driver,
            attendance_rows=payload.attendance,
            entry_exit_rows=payload.entry_exit_logs,
            max_trips=max_trips,
            lookback_days=payload.lookback_days,
        )
        for driver in payload.drivers
    ]
    return sorted(features, key=lambda entry: entry["predictedReliability"], reverse=True)


def pick_best_candidate(
    candidates: list[dict[str, Any]],
    route_bus_id: Any,
    used_driver_ids: set[Any],
    assignment_counter: dict[Any, int],
    prefer_spare: bool = False,
) -> dict[str, Any] | None:
    selected = None
    best_score = -1e9

    for candidate in candidates:
        driver_id = candidate.get("driverId")
        if driver_id in used_driver_ids:
            continue
        if candidate.get("status") != "Active":
            continue

        base_score = float(candidate.get("predictedReliability", 0))
        assigned_bus = candidate.get("assignedBus")
        bus_bonus = 0.2 if route_bus_id and str(assigned_bus) == str(route_bus_id) else 0
        load_penalty = assignment_counter.get(driver_id, 0) * (0.08 if prefer_spare else 0.12)
        risk = candidate.get("predictedRisk")
        risk_penalty = 0.2 if risk == "High" else 0.08 if risk == "Medium" else 0

        score = base_score + bus_bonus - load_penalty - risk_penalty
        if score > best_score:
            best_score = score
            selected = candidate

    return selected


def build_schedule_plan(
    routes: list[dict[str, Any]], driver_performance: list[dict[str, Any]], schedule_date: str
) -> list[dict[str, Any]]:
    assignments: list[dict[str, Any]] = []
    used_primary: set[Any] = set()
    assignment_counter: dict[Any, int] = {}

    active_routes = [route for route in routes if route.get("routeName")]

    for route in active_routes:
        route_bus_id = route.get("assignedBus")
        primary = pick_best_candidate(
            driver_performance,
            route_bus_id=route_bus_id,
            used_driver_ids=used_primary,
            assignment_counter=assignment_counter,
            prefer_spare=False,
        )
        if not primary:
            continue

        primary_id = primary.get("driverId")
        used_primary.add(primary_id)
        assignment_counter[primary_id] = assignment_counter.get(primary_id, 0) + 1

        spare = pick_best_candidate(
            driver_performance,
            route_bus_id=route_bus_id,
            used_driver_ids={primary_id},
            assignment_counter=assignment_counter,
            prefer_spare=True,
        )
        if spare:
            spare_id = spare.get("driverId")
            assignment_counter[spare_id] = assignment_counter.get(spare_id, 0) + 1

        bus_details = route.get("assignedBusDetails") or {}
        assignments.append(
            {
                "scheduleDate": schedule_date,
                "routeId": route.get("id"),
                "routeName": route.get("routeName"),
                "busId": route_bus_id,
                "busNumber": bus_details.get("busNumber"),
                "primaryDriverId": primary_id,
                "primaryDriverCode": primary.get("driverCode"),
                "spareDriverId": spare.get("driverId") if spare else None,
                "spareDriverCode": spare.get("driverCode") if spare else None,
                "predictedReliability": primary.get("predictedReliability"),
                "predictedRisk": primary.get("predictedRisk"),
                "status": "Planned",
                "notes": (
                    f"Spare {spare.get('driverName')} kept ready for fallback"
                    if spare
                    else "No spare available from active driver pool"
                ),
            }
        )

    return assignments


def recommend_spare_drivers(driver_performance: list[dict[str, Any]], limit: int = 5) -> list[dict[str, Any]]:
    risk_order = {"Low": 0, "Medium": 1, "High": 2}
    filtered = [entry for entry in driver_performance if entry.get("status") == "Active"]
    filtered.sort(
        key=lambda entry: (risk_order.get(entry.get("predictedRisk"), 9), -float(entry.get("predictedReliability", 0)))
    )
    safe_limit = max(1, int(limit or 5))
    return filtered[:safe_limit]


class MLServiceHandler(BaseHTTPRequestHandler):
    server_version = "BusMLPython/1.0"

    def do_GET(self) -> None:
        if self.path == "/health":
            self._json_response(200, {"status": "ok", "service": "python-ml"})
            return
        self._json_response(404, {"message": "Not found"})

    def do_POST(self) -> None:
        try:
            payload = self._read_json_payload()
        except ValueError as error:
            self._json_response(400, {"message": str(error)})
            return

        try:
            if self.path == "/driver-performance":
                self._handle_driver_performance(payload)
                return
            if self.path == "/driver-schedule-plan":
                self._handle_driver_schedule_plan(payload)
                return
            if self.path == "/driver-spares":
                self._handle_driver_spares(payload)
                return
            self._json_response(404, {"message": "Not found"})
        except Exception as error:  # noqa: BLE001
            self._json_response(500, {"message": "ML service failed", "error": str(error)})

    def _handle_driver_performance(self, payload: dict[str, Any]) -> None:
        lookback_days = max(1, int(payload.get("lookbackDays") or 30))
        performance = calculate_driver_performance(
            DriverPerformanceInput(
                drivers=list(payload.get("drivers") or []),
                attendance=list(payload.get("attendance") or []),
                entry_exit_logs=list(payload.get("entryExitLogs") or []),
                lookback_days=lookback_days,
            )
        )
        self._json_response(
            200,
            {
                "items": performance,
                "summary": {
                    "lookbackDays": lookback_days,
                    "totalDrivers": len(performance),
                    "lowRiskDrivers": sum(1 for row in performance if row.get("predictedRisk") == "Low"),
                    "highRiskDrivers": sum(1 for row in performance if row.get("predictedRisk") == "High"),
                },
            },
        )

    def _handle_driver_schedule_plan(self, payload: dict[str, Any]) -> None:
        routes = list(payload.get("routes") or [])
        performance = list(payload.get("driverPerformance") or [])
        schedule_date = to_date_only(payload.get("scheduleDate") or datetime.utcnow().date().isoformat())
        plan = build_schedule_plan(routes, performance, schedule_date)
        self._json_response(
            200,
            {"scheduleDate": schedule_date, "totalAssignments": len(plan), "items": plan},
        )

    def _handle_driver_spares(self, payload: dict[str, Any]) -> None:
        lookback_days = max(1, int(payload.get("lookbackDays") or 30))
        limit = max(1, int(payload.get("limit") or 5))
        performance = list(payload.get("driverPerformance") or [])

        if not performance:
            performance = calculate_driver_performance(
                DriverPerformanceInput(
                    drivers=list(payload.get("drivers") or []),
                    attendance=list(payload.get("attendance") or []),
                    entry_exit_logs=list(payload.get("entryExitLogs") or []),
                    lookback_days=lookback_days,
                )
            )

        recommendations = recommend_spare_drivers(performance, limit)
        self._json_response(
            200,
            {
                "lookbackDays": lookback_days,
                "totalRecommendations": len(recommendations),
                "items": recommendations,
            },
        )

    def _read_json_payload(self) -> dict[str, Any]:
        content_length = int(self.headers.get("Content-Length", "0"))
        if content_length <= 0:
            return {}
        raw_body = self.rfile.read(content_length).decode("utf-8")
        if not raw_body.strip():
            return {}
        try:
            parsed = json.loads(raw_body)
        except json.JSONDecodeError as error:
            raise ValueError("Invalid JSON payload") from error
        if not isinstance(parsed, dict):
            raise ValueError("JSON payload must be an object")
        return parsed

    def _json_response(self, status_code: int, payload: dict[str, Any]) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *_args: Any) -> None:
        return


def run() -> None:
    port = int(os.environ.get("ML_SERVICE_PORT", "8001"))
    server = HTTPServer(("0.0.0.0", port), MLServiceHandler)
    print(f"Python ML service running on port {port}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    run()
