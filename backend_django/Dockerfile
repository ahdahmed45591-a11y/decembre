FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Non-root. Sous Linux, donner l'ecriture a l'uid 999 sur data/uploads (chown 999 data/uploads).
RUN useradd --system --uid 999 app
USER app

CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py seed && gunicorn config.wsgi:application --bind 0.0.0.0:3001 --workers 3"]
