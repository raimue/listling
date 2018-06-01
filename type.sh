#!/bin/sh

#python3 -m tornado.autoreload -m mypy micro/jsonredis.py micro/tests/test_jsonredis.py
MYPYPATH=../../micro/repo mypy --ignore-missing-imports listling/listling.py listling/tests/test_listling.py
