PYTHON ?= python3
HOST ?= 127.0.0.1
PORT ?= 8000

.PHONY: serve

serve:
	$(PYTHON) -m http.server $(PORT) --bind $(HOST)
