FROM python:3.13-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .
COPY database/ /database/

ENV FLASK_APP=run.py
ENV FLASK_ENV=production
ENV FLASK_DEBUG=false
ENV INIT_DB=true
ENV PORT=5000
ENV SQL_DIR=/database/mysql

EXPOSE 5000

CMD ["python", "run.py"]
