FROM mwalbeck/python-poetry:1-3.11
RUN apt update && apt install -y socat
WORKDIR /poetry
COPY poetry.lock pyproject.toml ./
RUN poetry install --no-dev --no-interaction --no-ansi
COPY . .
CMD ["socat", "TCP-LISTEN:1337,reuseaddr,fork", "EXEC:timeout 180 poetry run python -m poetry,pty,stderr,echo=0"]
