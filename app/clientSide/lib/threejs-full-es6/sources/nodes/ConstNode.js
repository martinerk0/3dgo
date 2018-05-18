import { TempNode } from '../nodes/TempNode.js'

/**
 * @author sunag / http://www.sunag.com.br/
 */

var ConstNode = function( src, useDefine ) {

	TempNode.call( this );

	this.eval( src || ConstNode.PI, useDefine );

};

ConstNode.PI = 'PI';
ConstNode.PI2 = 'PI2';
ConstNode.RECIPROCAL_PI = 'RECIPROCAL_PI';
ConstNode.RECIPROCAL_PI2 = 'RECIPROCAL_PI2';
ConstNode.LOG2 = 'LOG2';
ConstNode.EPSILON = 'EPSILON';

ConstNode.prototype = Object.create( TempNode.prototype );
ConstNode.prototype.constructor = ConstNode;

ConstNode.prototype.getType = function( builder ) {

	return builder.getTypeByFormat( this.type );

};

ConstNode.prototype.eval = function( src, useDefine ) {

	src = ( src || '' ).trim();

	var name, type, value;

	var rDeclaration = /^([a-z_0-9]+)\s([a-z_0-9]+)\s?\=?\s?(.*?)(\;|$)/i;
	var match = src.match( rDeclaration );

	this.useDefine = useDefine;

	if ( match && match.length > 1 ) {

		type = match[ 1 ];
		name = match[ 2 ];
		value = match[ 3 ];

	} else {

		name = src;
		type = 'fv1';

	}

	this.name = name;
	this.type = type;
	this.value = value;

};

ConstNode.prototype.build = function( builder, output ) {

	if ( output === 'source' ) {

		if ( this.value ) {

			if ( this.useDefine ) {

				return '#define ' + this.name + ' ' + this.value;

			}

			return 'const ' + this.type + ' ' + this.name + ' = ' + this.value + ';';

		}

	} else {

		builder.include( this );

		return builder.format( this.name, this.getType( builder ), output );

	}

};

ConstNode.prototype.generate = function( builder, output ) {

	return builder.format( this.name, this.getType( builder ), output );

};

export { ConstNode }
