'use strict';

coldIron.Math = {};

coldIron.Math.Grid = class{
    constructor(width, height, data) {
    this._width = width;
    this._height = height;
    this._data = data || [];
    }

    // check if coordinates are found within
    contains(x, y) { 
        return (x >= 0 && x < this._width && y >= 0 && y < this._height); 
    }

    getValue(x, y) {
        return this._data[x + this._width * y];
    }
    
    setValue(x, y, value) {
        this._data[x + this._width * y] = value;
    }

    get width() {
        return this._width;
    }

    get height() {
        return this._height;
    }

};

coldIron.Math.getDistance = function(startX, startY, endX, endY) {
    // calculates a straight line between two points
    if (startX === endX) {
        return Math.abs(endY - startY);
    } else if (startY === endY) {
        return Math.abs(endX - startX);
    } else {
        return Math.sqrt(Math.pow((startX-endX), 2) + Math.pow((startY-endY), 2));
    }
};