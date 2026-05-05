import logging
from logging import FileHandler
from app.core.logger import setup_logger, get_logger


def test_setup_logger_returns_logger():
    logger = setup_logger("test_module")
    assert isinstance(logger, logging.Logger)
    assert logger.name == "test_module"


def test_setup_logger_sets_level():
    logger = setup_logger("test_level", level=logging.WARNING)
    assert logger.level == logging.WARNING


def test_setup_logger_adds_handlers():
    logger = setup_logger("test_handler")
    assert len(logger.handlers) == 2


def test_setup_logger_has_file_handler():
    logger = setup_logger("test_file")
    file_handlers = [h for h in logger.handlers if isinstance(h, FileHandler)]
    assert len(file_handlers) == 1


def test_get_logger_returns_same_instance():
    logger1 = get_logger("shared_logger")
    logger2 = get_logger("shared_logger")
    assert logger1 is logger2


def test_get_logger_default_name():
    logger = get_logger()
    assert logger.name == "qingtou"
