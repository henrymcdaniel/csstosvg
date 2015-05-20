csstosvg
========
Example usage:

csstosvg.apply( OBJECT,'box-shadow: 4px 4px 10px red');

Where OBJECT is the SVG element to apply the shadow to.

Yes, every type of shadow CSS supports are included except:

*No support for spread radius.
*You can't specify multiple shadows in a single apply() call.
*Behavior will differ from pure CSS when the border of the OBJECT element is larger than a few pixels.

