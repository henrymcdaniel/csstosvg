// Author: Henry McDaniel / henry@sunsetrainbow.com
// Simple tool for applying basic shadows to SVG elements.

csstosvg = { };

csstosvg.Internal=  (function(inObj,inCommand) {

	self.Data = {
		initialized: false
	};

	self.Utility = {
		perror: function(str) {
			if (window.console) {
				window.console.log('csstosvg: '+str);
			}
		},

		init: function() {
			self.Data.initialized = true;
		},
		
		sanityCheck : function() {
			self.init();
			return self.Data.initialized;
		},
	
		getRootSVG: function(el) {
			var context = 0;
			if (el && el[0] && el[0][0]) {
				context = el[0][0].ownerSVGElement;
			} else {
				context=el.parentElement;
			}
			return context;
		},
		
		attr: function(el,prop) {
			var v=0;
			if (typeof el.attr == 'function') {
				v= el.attr(prop);
			} else {
				v= el.getAttribute(prop);
			}
			return v;
		},
		setAttr: function(el,prop,v) {
			if (typeof el.attr == 'function') {
				el.attr(prop,v);
			} else {
				el.setAttribute(prop,v);
			}			
		}
	};
	self.Parse = {

		isPercent: function(str) {
			return (str[str.length-1]==='%' ? true : false);
		},
		isNumeric: function (obj) {
			return (obj[0]=='0' || obj[0]=='-' || parseInt(obj) ? true : false);
		},
		color: function (str) {
			var out='',
				opacity=1,
				error=0;

			if (str.length<3) {
				error++;
			} else if (str.indexOf('rgb(')>-1||str.indexOf('rgba(')>-1) {
				str = str.replace(/(rgb\(|rgba\(|\)|;|\s)/gi,'');
				var codes=str.split(',');
				if (codes && codes.length>2) {
					out='rgb(';
					for (var i=0; i < 3; i++) {
						if (!self.Parse.isNumeric(codes[i])) {
							error++;
							break;
						}
						out+=codes[i]+(i<2?',':'');
					}
					out+=')';
					if (codes.length==4) {
						opacity = codes[3];
						if (!self.Parse.isNumeric(opacity)) {
							error++;
						}
					}
				} else {
					error++;
				}
			} else {			
				if (str[str.length-1]==';') {
					out=str.substring(0,str.length-1);
				} else {
					out=str;
				}
			}
			var ret= {
				color: out,
				opacity: opacity,
				error:error
			};
			return ret;
		},
		cssLineSplit: function (s) {
			var lines= s.replace(/(#[a-z0-9]*|\)),/ig, '$1\u000B').split('\u000B');
			return lines;
		}	
	};
	self.SVG = {
	
			getNameSpace: function () {
				return "http://www.w3.org/2000/svg";
			},
			createElement: function (NS,name) {
				var obj = document.createElementNS(NS,name);
				return obj;
			},

			createShadow: function(c,p) {
				var NS=self.SVG.getNameSpace();
				var defs,
					addDefs=false;
				var defList = c.getElementsByTagName('defs');
				
				if (defList && defList.length) {
					defs = defList[defList.length-1];
				} else {
					defs = self.SVG.createElement(NS,'defs');
					addDefs=true;
				}

				var filter=self.SVG.createElement(NS,'filter');
				filter.setAttributeNS(null,'id',p.id);
				if (p.negX) {
					filter.setAttributeNS(null,'x',p.negX);
				}
				if (p.negY) {
					filter.setAttributeNS(null,'y',p.negY);
				}
			//	filter.setAttributeNS(null,'preserveAspectRatio','none');
				
				if (obj.width) {
					filter.setAttributeNS(null,'width',obj.width);
				}
				if (obj.height) {
					filter.setAttributeNS(null,'height',obj.height);
				}
				var feGaussianBlur = self.SVG.createElement(NS,'feGaussianBlur');
				feGaussianBlur.setAttributeNS(null,'in','SourceAlpha');
				feGaussianBlur.setAttributeNS(null,'stdDeviation',obj.deviation);
				var feOffset = self.SVG.createElement(NS,'feOffset');
				feOffset.setAttributeNS(null,'dx',p.dx);
				feOffset.setAttributeNS(null,'dy',p.dy);
				
				if ( p.inset === false ) {
					feOffset.setAttributeNS(null,'result','offsetblur');
					
					var feFlood = self.SVG.createElement(NS,'feFlood');
					feFlood.setAttributeNS(null,'flood-color',p.color);
					feFlood.setAttributeNS(null,'flood-opacity',p.opacity);
										
					var feComposite = self.SVG.createElement(NS,'feComposite');
					feComposite.setAttributeNS(null,'in2','offsetblur');
					feComposite.setAttributeNS(null,'operator','in');
					var feMerge = self.SVG.createElement(NS,'feMerge');
					var feMergeNode0 = self.SVG.createElement(NS,'feMergeNode');
					var feMergeNode1 = self.SVG.createElement(NS,'feMergeNode');
					feMergeNode1.setAttributeNS(null,'in','SourceGraphic');
					
					
					filter.appendChild(feGaussianBlur);
					filter.appendChild(feOffset);
					filter.appendChild(feFlood);
					filter.appendChild(feComposite);

					feMerge.appendChild(feMergeNode0);
					feMerge.appendChild(feMergeNode1);
					filter.appendChild(feMerge);

					
				} else {
					feGaussianBlur.setAttributeNS(null,'result','blur');

					var feComposite0 = self.SVG.createElement(NS,'feComposite');
					feComposite0.setAttributeNS(null,'in2','SourceAlpha');
					feComposite0.setAttributeNS(null,'operator','arithmetic');
					feComposite0.setAttributeNS(null,'k2',-1.4);
					feComposite0.setAttributeNS(null,'k3',1.4);
					feComposite0.setAttributeNS(null,'result','shadowDiff');

					var feFlood = self.SVG.createElement(NS,'feFlood');
					feFlood.setAttributeNS(null,'flood-color',p.color);
					feFlood.setAttributeNS(null,'flood-opacity',p.opacity);
					
					var feComposite1 = self.SVG.createElement(NS,'feComposite');
					feComposite1.setAttributeNS(null,'in2','shadowDiff');
					feComposite1.setAttributeNS(null,'operator','in');
					var feComposite2 = self.SVG.createElement(NS,'feComposite');
					feComposite2.setAttributeNS(null,'in2','SourceGraphic');
					feComposite2.setAttributeNS(null,'operator','over');
					
					filter.appendChild(feGaussianBlur);
					filter.appendChild(feOffset);
					filter.appendChild(feComposite0);
					filter.appendChild(feFlood);
					filter.appendChild(feComposite1);
					filter.appendChild(feComposite2);
				}
				
				defs.appendChild( filter);
				if (addDefs === true) {
					c.appendChild(defs);
				}
			}
		}; // end of svg
	
	self.CSS = {
		boxShadowTriplet: function(str) {
			var word=str.split(' '),
				params={
					offsetX: { require: true, number: true, def: 0 },
					offsetY: { require: true, number: true, def: 0 },
					blurRadius: { require: false, number: true, percentAllowed: true, def: '100%' },
					spreadRadius: { require: false, number: true, percentAllowed: true, def: '0' },
					color: { require: false, number: false, color: true, def: '' }
					},
				offset=0,
				out={inset: false},
				number,
				value,
				error=0,
				afterFirst=0;
			for (var key in params)
			{
				out[key]=params[key].def;
				if (!error) {
					if (offset<word.length) {
						value = word[offset];
						if (!value) {
							while (offset<word.length && !word[offset]) {
								offset++;
							}
							if (offset >= word.length) {
								break;
							}
							value = word[offset];
						}
						if (!afterFirst) {
							if (value==='none') {
								out.none = true;
								break;
							} else if (value==='inset') {
								out.inset = true;
								offset++;
								value=word[offset];
							}
						}
						number = self.Parse.isNumeric(value);
						if (!number) {
							if (params[key].number) {
								if (params[key].required) {
									error++;
									self.Utility.perror('number expected. instead got: "'+value+'"');
								} else {
									continue;
								}
							} else if (params[key].color) {
								var tmp = self.Parse.color(value);
								value = tmp.color;
								out['opacity'] = tmp.opacity;
								error+=tmp.error;
								if (error) {
									self.Utility.perror('color malformed: "'+tmp.color+'"');
								}
							}
						}
						else {
							if (params[key].percentAllowed && self.Parse.isPercent(value)) {
								;
							} else {
								value = parseInt(value);
							}
						}
						afterFirst++;
						out[key]=value;
						offset++;
					}
				}
			}
			out.error=error;
			return out;
		},

		INboxShadow : function(str) {
			var out={ error: 0, group: [] },
				lists=self.Parse.cssLineSplit(str);
//str.split(', ');
			for (var i=0; i<lists.length; i++)
			{
				out.group[i]=self.CSS.boxShadowTriplet(lists[i]);
				out.error += out.group[i].error;
			}
			return out;
		},

		OUTboxShadow : function(context,elem,params) {
			if (params.error) {
				return;
			}
			var d,
				ID;
				
			for (var i=0; i < params.group.length; i++) {
				d=params.group[i];
			
			var deviation,
				deviationIsPercent=false;

			if (self.Parse.isPercent(d.blurRadius)) {
				var p=parseInt(d.blurRadius);
				if (p) {
					deviationIsPercent=true;
					p *= 0.5;
					deviation = p+'%';
				}
			} else {
				if (d.blurRadius) {
					deviation = d.blurRadius * 0.5;
				} else {
					deviation = 1;
				}
			}
			var	opacity=(d.opacity ? d.opacity : 1),			
				negX='-100%', negY='-100%',
				widthPercent=300;

			if (d.spreadRadius) {
				var tmp=0,
					dINT=parseInt(deviation),
					spread=parseInt(d.spreadRadius),
					spreadIsPercent = self.Parse.isPercent(d.spreadRadius);
				
				if (
					(spreadIsPercent == deviationIsPercent)
					|| (!spreadIsPercent && deviationIsPercent)
				) {
					dINT += (0.5*spread);					
				} else {
					// spreadIsPercent && !deviationIsPercent
					if (!(tmp=parseInt( self.Utility.attr(elem,'r')))) {
						tmp=Math.round((self.Utility.attr(elem,'width')+self.Utility.attr(elem,'height'))/2);
					}
					dINT += Math.round(0.5 * spread * tmp);
				}
				deviation = dINT + (deviationIsPercent ? '%' : '');
			}
			
			if (d.inset === true) {
				negX=0;
				negY=0;
				widthPercent-=70;
				deviation=6.5;
			}
			var width=widthPercent+'%',
				height=widthPercent+'%';

			var eid = self.Utility.attr(elem,'id');
			if (!eid) {
				eid = 'rand-'+Math.floor(Math.random()*1000000);
			}
			ID=eid+'-csstosvg'+i;
			
			obj={
					id: ID,
					width: width,
					height: height,
					negX:  negX,
					negY:  negY,
	
					dx: d.offsetX,
					dy: d.offsetY,
					deviation: deviation,
					opacity: opacity,
					color: d.color,
					inset: d.inset,
				
					spread: spread
				};
				self.SVG.createShadow(context,obj);
				self.Utility.setAttr(elem,'filter','url(#'+ID+')');	
			}
		},

		process : function(obj,str) {
			var words = str.split(':'),
				firstWord = words[0],
				following = (firstWord.length<str.length ? str.substr(firstWord.length+1) : ''),
				context=self.Utility.getRootSVG(obj);
			if (firstWord === 'box-shadow') {
				self.CSS.OUTboxShadow(context,obj,self.CSS.INboxShadow(following));
			}
			return csstosvg;
		}
	}; // end of css		
	return self.CSS.process(inObj,inCommand);
});  // end of internal
csstosvg.apply = csstosvg.Internal;

