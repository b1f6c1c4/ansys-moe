FROM python:3-alpine

WORKDIR /usr/src/ansys-core
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "."]
