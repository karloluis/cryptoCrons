import dotenv from 'dotenv';
import Promise from 'bluebird';
import ms from 'ms';
import _ from 'lodash';

// Load environment variables from .env
dotenv.config();

// Set bluebird as the global promise
global.Promise = Promise;

class ENV {

  get(variable, defaultValue) {
    let value = process.env[variable];

    if (_.isString(value)) {
      value = value.trim();
    }

    if (value === undefined || value === null || value === '') {
      value = defaultValue;
    }

    return value;
  }

  number(variable, defaultValue) {
    const value = this.get(variable, defaultValue);
    return this._number(value, defaultValue);
  }

  _number(originalValue, defaultValue, recursive = true) {
    let value = originalValue;
    if (_.isNumber(value)) {
      return value;
    } else if (_.isString(value)) {
      value = value.trim().replace(',', '');
    } else if (!recursive) {
      return undefined;
    }

    value = parseFloat(value, 10);
    if (isNaN(value)) {
      value = this._number(defaultValue, undefined, false);
    }

    return value;
  }

  bool(variable, defaultValue) {
    const value = this.get(variable, defaultValue);
    return this._bool(value, defaultValue);
  }

  _bool(value, defaultValue, recursive = true) {
    if (_.isBoolean(value)) {
      return value;
    } else if (_.isNumber(value)) {
      return !!value;
    } else if (_.isString(value) && ['true', 't', 'yes', 'y', '1'].indexOf(value.trim().toLowerCase()) !== -1) {
      return true;
    } else if (_.isString(value) && ['false', 'f', 'no', 'n', '0'].indexOf(value.trim().toLowerCase()) !== -1) {
      return false;
    } else if (!recursive) {
      return undefined;
    }

    return this._bool(defaultValue, undefined, false);
  }

  ms(variable, defaultValue = false) {
    const value = this.get(variable, defaultValue);
    return this._ms(value, defaultValue);
  }

  _ms(originalValue, defaultValue = '0ms', recursive = false) {
    let value = null;

    if (_.isNumber(originalValue)) {
      return originalValue;
    } else if (_.isString(originalValue)) {
      value = originalValue;
    } else if (!recursive) {
      return undefined;
    }

    value = ms(value);
    if (value === undefined) {
      value = this._ms(defaultValue, undefined, false);
    }

    return value;
  }

}

export default new ENV();
