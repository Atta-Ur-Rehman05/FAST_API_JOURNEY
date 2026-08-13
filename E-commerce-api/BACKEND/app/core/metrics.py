from prometheus_client import Counter, Histogram, Gauge

REQUEST_DURATION = Histogram(
    "http_request_duration_seconds",
    "Response time per HTTP request",
    ["method", "endpoint", "status_code"],
)

LOGIN_FAILURES = Counter(
    "login_failures_total",
    "Total number of failed login attempts",
    ["reason"],
)

CHECKOUT_RESULTS = Counter(
    "checkout_results_total",
    "Total number of checkout attempts by result",
    ["result"],
)

PAYMENT_FAILURES = Counter(
    "payment_failures_total",
    "Total number of payment failures",
    ["reason"],
)

STOCK_CONFLICTS = Counter(
    "stock_conflicts_total",
    "Total number of checkout attempts blocked by insufficient stock",
)

REDIS_UP = Gauge(
    "redis_up",
    "Whether Redis is reachable",
)

POSTGRES_UP = Gauge(
    "postgres_up",
    "Whether PostgreSQL is reachable",
)
