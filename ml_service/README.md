# Python ML Microservice

This service contains all ML logic for:
- Driver performance scoring
- Spare driver recommendations
- Driver schedule planning

## Run Locally

```bash
cd ml_service
python app.py
```

Service URL: `http://127.0.0.1:8001`

## Endpoints

- `GET /health`
- `POST /driver-performance`
- `POST /driver-schedule-plan`
- `POST /driver-spares`
