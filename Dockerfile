FROM python:3.6

RUN pip install pipenv

WORKDIR /usr/src/ansys-core
COPY Pipfile* ./
RUN pipenv install --system

COPY . .

CMD ["python", "./src"]
