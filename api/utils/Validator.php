<?php
/**
 * Input Validation Helper
 * 
 * Provides input validation and sanitization utilities.
 */

// Prevent direct access
if (!defined('API_ACCESS')) {
    http_response_code(403);
    exit('Direct access not allowed');
}

class Validator {
    private array $errors = [];
    private array $data = [];
    
    /**
     * Create a new validator instance
     */
    public function __construct(array $data) {
        $this->data = $data;
    }
    
    /**
     * Static factory method
     */
    public static function make(array $data): self {
        return new self($data);
    }
    
    /**
     * Validate required field
     */
    public function required(string $field, string $message = null): self {
        if (!isset($this->data[$field]) || trim($this->data[$field]) === '') {
            $this->errors[$field] = $message ?? "The {$field} field is required.";
        }
        return $this;
    }
    
    /**
     * Validate email format
     */
    public function email(string $field, string $message = null): self {
        if (isset($this->data[$field]) && !filter_var($this->data[$field], FILTER_VALIDATE_EMAIL)) {
            $this->errors[$field] = $message ?? "The {$field} must be a valid email address.";
        }
        return $this;
    }
    
    /**
     * Validate minimum length
     */
    public function minLength(string $field, int $min, string $message = null): self {
        if (isset($this->data[$field]) && strlen($this->data[$field]) < $min) {
            $this->errors[$field] = $message ?? "The {$field} must be at least {$min} characters.";
        }
        return $this;
    }
    
    /**
     * Validate maximum length
     */
    public function maxLength(string $field, int $max, string $message = null): self {
        if (isset($this->data[$field]) && strlen($this->data[$field]) > $max) {
            $this->errors[$field] = $message ?? "The {$field} must not exceed {$max} characters.";
        }
        return $this;
    }
    
    /**
     * Validate field is in array of allowed values
     */
    public function in(string $field, array $allowed, string $message = null): self {
        if (isset($this->data[$field]) && !in_array($this->data[$field], $allowed)) {
            $allowedStr = implode(', ', $allowed);
            $this->errors[$field] = $message ?? "The {$field} must be one of: {$allowedStr}.";
        }
        return $this;
    }
    
    /**
     * Validate numeric value
     */
    public function numeric(string $field, string $message = null): self {
        if (isset($this->data[$field]) && !is_numeric($this->data[$field])) {
            $this->errors[$field] = $message ?? "The {$field} must be a number.";
        }
        return $this;
    }
    
    /**
     * Validate integer value
     */
    public function integer(string $field, string $message = null): self {
        if (isset($this->data[$field]) && !filter_var($this->data[$field], FILTER_VALIDATE_INT)) {
            $this->errors[$field] = $message ?? "The {$field} must be an integer.";
        }
        return $this;
    }
    
    /**
     * Validate minimum value
     */
    public function min(string $field, float $min, string $message = null): self {
        if (isset($this->data[$field]) && is_numeric($this->data[$field]) && $this->data[$field] < $min) {
            $this->errors[$field] = $message ?? "The {$field} must be at least {$min}.";
        }
        return $this;
    }
    
    /**
     * Validate maximum value
     */
    public function max(string $field, float $max, string $message = null): self {
        if (isset($this->data[$field]) && is_numeric($this->data[$field]) && $this->data[$field] > $max) {
            $this->errors[$field] = $message ?? "The {$field} must not exceed {$max}.";
        }
        return $this;
    }
    
    /**
     * Validate date format
     */
    public function date(string $field, string $format = 'Y-m-d', string $message = null): self {
        if (isset($this->data[$field])) {
            $date = \DateTime::createFromFormat($format, $this->data[$field]);
            if (!$date || $date->format($format) !== $this->data[$field]) {
                $this->errors[$field] = $message ?? "The {$field} must be a valid date in format {$format}.";
            }
        }
        return $this;
    }
    
    /**
     * Validate time format
     */
    public function time(string $field, string $format = 'H:i', string $message = null): self {
        if (isset($this->data[$field])) {
            $time = \DateTime::createFromFormat($format, $this->data[$field]);
            if (!$time || $time->format($format) !== $this->data[$field]) {
                $this->errors[$field] = $message ?? "The {$field} must be a valid time in format {$format}.";
            }
        }
        return $this;
    }
    
    /**
     * Validate JSON string
     */
    public function json(string $field, string $message = null): self {
        if (isset($this->data[$field])) {
            json_decode($this->data[$field]);
            if (json_last_error() !== JSON_ERROR_NONE) {
                $this->errors[$field] = $message ?? "The {$field} must be valid JSON.";
            }
        }
        return $this;
    }
    
    /**
     * Validate URL
     */
    public function url(string $field, string $message = null): self {
        if (isset($this->data[$field]) && !filter_var($this->data[$field], FILTER_VALIDATE_URL)) {
            $this->errors[$field] = $message ?? "The {$field} must be a valid URL.";
        }
        return $this;
    }
    
    /**
     * Validate boolean
     */
    public function boolean(string $field, string $message = null): self {
        if (isset($this->data[$field])) {
            $val = $this->data[$field];
            if (!in_array($val, [true, false, 0, 1, '0', '1', 'true', 'false'], true)) {
                $this->errors[$field] = $message ?? "The {$field} must be a boolean value.";
            }
        }
        return $this;
    }
    
    /**
     * Validate password strength
     */
    public function password(string $field, string $message = null): self {
        if (isset($this->data[$field])) {
            $password = $this->data[$field];
            if (strlen($password) < 8) {
                $this->errors[$field] = $message ?? "Password must be at least 8 characters.";
            }
        }
        return $this;
    }
    
    /**
     * Custom validation callback
     */
    public function custom(string $field, callable $callback, string $message): self {
        if (isset($this->data[$field]) && !$callback($this->data[$field])) {
            $this->errors[$field] = $message;
        }
        return $this;
    }
    
    /**
     * Check if validation passed
     */
    public function passes(): bool {
        return empty($this->errors);
    }
    
    /**
     * Check if validation failed
     */
    public function fails(): bool {
        return !$this->passes();
    }
    
    /**
     * Get validation errors
     */
    public function errors(): array {
        return $this->errors;
    }
    
    /**
     * Get validated data
     */
    public function validated(): array {
        return array_diff_key($this->data, $this->errors);
    }
    
    /**
     * Validate and return errors if failed
     */
    public function validate(): void {
        if ($this->fails()) {
            Response::validationError($this->errors);
        }
    }
    
    // ==========================================
    // Static Sanitization Methods
    // ==========================================
    
    /**
     * Sanitize string input
     */
    public static function sanitizeString(?string $input): string {
        if ($input === null) {
            return '';
        }
        return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
    }
    
    /**
     * Sanitize email
     */
    public static function sanitizeEmail(?string $email): string {
        if ($email === null) {
            return '';
        }
        return filter_var(strtolower(trim($email)), FILTER_SANITIZE_EMAIL);
    }
    
    /**
     * Sanitize integer
     */
    public static function sanitizeInt($input): int {
        return (int) filter_var($input, FILTER_SANITIZE_NUMBER_INT);
    }
    
    /**
     * Sanitize float
     */
    public static function sanitizeFloat($input): float {
        return (float) filter_var($input, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
    }
    
    /**
     * Get JSON body from request
     */
    public static function getJsonBody(): array {
        $body = file_get_contents('php://input');
        $data = json_decode($body, true);
        return $data ?? [];
    }
    
    /**
     * Get query parameter
     */
    public static function getQuery(string $key, $default = null) {
        return $_GET[$key] ?? $default;
    }
    
    /**
     * Get pagination parameters
     */
    public static function getPagination(): array {
        $page = max(1, self::sanitizeInt(self::getQuery('page', 1)));
        $perPage = min(
            MAX_PAGE_SIZE,
            max(1, self::sanitizeInt(self::getQuery('per_page', DEFAULT_PAGE_SIZE)))
        );
        $offset = ($page - 1) * $perPage;
        
        return [
            'page' => $page,
            'per_page' => $perPage,
            'offset' => $offset,
        ];
    }
}
