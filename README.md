csstosvg
========
Example usage:

csstosvg.apply( OBJECT,'box-shadow: 4px 4px 10px red');

Where OBJECT is the SVG element to apply the shadow to.

Current Limitations:
*No support for spread radius.
*You can't specify multiple shadows in a single apply() call. For example CSS allows stuff like: 4px 4px red, 5px, 10px blue --- Most of the code required to do that is done but it's not operational.
*Behavior will differ from pure CSS when the border of the OBJECT element is larger than a few pixels.

