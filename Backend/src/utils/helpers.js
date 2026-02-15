const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const settings = require('../config/settings');
const logger = require('./logger');

class Helpers {
    constructor() {
        this.settings = settings;
    }

    async hashData(data, saltRounds = parseInt(this.settings.BCRYPT_SALT_ROUNDS, 10) || 12) {
        try {
            if (!data || typeof data !== 'string') throw new Error('Data must be a non-empty string');
            const salt = await bcrypt.genSalt(saltRounds);
            return await bcrypt.hash(data, salt);
        } catch (error) {
            logger.error('Hashing error:', error.message);
            throw new Error('Failed to hash data');
        }
    }

    async compareData(plaintext, hashed) {
        try {
            if (!plaintext || !hashed) return false;
            return await bcrypt.compare(plaintext, hashed);
        } catch (error) {
            logger.error('Comparison error:', error.message);
            return false;
        }
    }

    generateSecureRandom(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }

    generateSecretCode() {
        const timestamp = Date.now().toString();
        const randomBytes = crypto.randomBytes(16).toString('hex');
        return crypto.createHash('sha256').update(`${timestamp}_${randomBytes}`).digest('hex');
    }

    async hashPattern(pattern) {
        if (!Array.isArray(pattern)) {
            throw new Error('Pattern must be an array');
        }

        if (pattern.length === 0) {
            throw new Error('Pattern must contain at least one element');
        }

        const first = pattern.find((el) => el !== undefined && el !== null);
        if (first === undefined) {
            throw new Error('Pattern must contain at least one valid element');
        }

        let normalized;

        if (typeof first === 'number' || typeof first === 'string') {
            normalized = pattern.map((el) => String(el).trim());
        } else if (typeof first === 'object') {
            normalized = pattern.map((el) => {
                if (!el || typeof el !== 'object') {
                    throw new Error('Invalid pattern element');
                }

                return {
                    number: String(el.number).trim(),
                    color: String(el.color).trim().toLowerCase(),
                };
            });
        } else {
            throw new Error('Unsupported pattern element type');
        }

        return this.hashData(JSON.stringify(normalized));
    }

    async verifyPattern(pattern, hashedPattern) {
        try {
            if (!Array.isArray(pattern) || !hashedPattern) {
                return false;
            }

            if (pattern.length === 0) {
                return false;
            }

            const first = pattern.find((el) => el !== undefined && el !== null);
            if (first === undefined) {
                return false;
            }

            let normalized;

            if (typeof first === 'number' || typeof first === 'string') {
                normalized = pattern.map((el) => String(el).trim());
            } else if (typeof first === 'object') {
                normalized = pattern.map((el) => {
                    if (!el || typeof el !== 'object') {
                        return null;
                    }

                    return {
                        number: String(el.number).trim(),
                        color: String(el.color).trim().toLowerCase(),
                    };
                });

                if (normalized.includes(null)) {
                    return false;
                }
            } else {
                return false;
            }

            // Order-sensitive (NO SORTING)
            return await this.compareData(
                JSON.stringify(normalized),
                hashedPattern,
            );
        } catch (error) {
            logger.error('Pattern verification error:', error.message);
            return false;
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        return emailRegex.test(email);
    }

    validatePattern(pattern) {
        const result = { isValid: true, errors: [] };

        if (!Array.isArray(pattern)) {
            return { isValid: false, errors: ['Pattern must be an array'] };
        }

        if (pattern.length === 0) {
            return { isValid: false, errors: ['Pattern must contain at least one element'] };
        }

        const first = pattern.find((el) => el !== undefined && el !== null);

        if (first === undefined) {
            return { isValid: false, errors: ['Pattern must contain at least one valid element'] };
        }

        // -------- Picture Pattern (Flexible) --------
        if (typeof first === 'number' || typeof first === 'string') {
            if (pattern.length < 4 || pattern.length > 9) {
                result.isValid = false;
                result.errors.push('Pattern must have between 4 and 9 elements');
            }

            pattern.forEach((el, i) => {
                if (el === undefined || el === null) {
                    result.isValid = false;
                    result.errors.push(`Element ${i + 1} cannot be null or undefined`);
                }

                if (typeof el !== 'number' && typeof el !== 'string') {
                    result.isValid = false;
                    result.errors.push(`Element ${i + 1} must be a number or string`);
                }
            });

            return result;
        }

        // -------- Number-Color Pattern (Fully Flexible) --------
        if (typeof first === 'object') {
            if (pattern.length < 4 || pattern.length > 8) {
                result.isValid = false;
                result.errors.push('Pattern must have between 4 and 8 elements');
            }

            pattern.forEach((el, i) => {
                if (!el || typeof el !== 'object') {
                    result.isValid = false;
                    result.errors.push(`Element ${i + 1} must be an object`);
                    return;
                }

                if (!('number' in el)) {
                    result.isValid = false;
                    result.errors.push(`Element ${i + 1} must contain a number property`);
                }

                if (!('color' in el)) {
                    result.isValid = false;
                    result.errors.push(`Element ${i + 1} must contain a color property`);
                }

                if (el.number === undefined || el.number === null) {
                    result.isValid = false;
                    result.errors.push(`Element ${i + 1} number cannot be null or undefined`);
                }

                if (el.color === undefined || el.color === null) {
                    result.isValid = false;
                    result.errors.push(`Element ${i + 1} color cannot be null or undefined`);
                }
            });

            return result;
        }

        return { isValid: false, errors: ['Unsupported pattern element type'] };
    }

    sanitizeInput(input, maxLength = 1000) {
        if (typeof input !== 'string') return '';
        const cleaned = input.trim().slice(0, maxLength).replace(/[<>]/g, '');
        const withoutJsProto = cleaned.replace(/javascript:/gi, '');
        return withoutJsProto.replace(/on\w+=/gi, '');
    }
}

const helpers = new Helpers();

module.exports = {
    hashingUtils: {
        hashData: helpers.hashData.bind(helpers),
        compareData: helpers.compareData.bind(helpers),
        generateSecureRandom: helpers.generateSecureRandom.bind(helpers),
        generateSecretCode: helpers.generateSecretCode.bind(helpers),
        hashPattern: helpers.hashPattern.bind(helpers),
        verifyPattern: helpers.verifyPattern.bind(helpers),
    },
    validationUtils: {
        isValidEmail: helpers.isValidEmail.bind(helpers),
        validatePattern: helpers.validatePattern.bind(helpers),
        sanitizeInput: helpers.sanitizeInput.bind(helpers),
    },
};
