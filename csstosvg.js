// Author: Henry McDaniel / henry@sunsetrainbow.com
// Simple tool for applying basic shadows to SVG elements.

csstosvg = {};
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
				error='';

			if (str.length<3) {
				error='string too short';
			} else if (str.indexOf('rgb(')>-1||str.indexOf('rgba(')>-1) {
				str = str.replace(/(rgb\(|rgba\(|\)|;|\s)/gi,'');
				var codes=str.split(',');
				if (codes && codes.length>2) {
					out='rgb(';
					for (var i=0; i < 3; i++) {
						if (!self.Parse.isNumeric(codes[i])) {
							error='rgb color value ['+codes[i]+'] is not a number';
							break;
						}
						out+=codes[i]+(i<2?',':'');
					}
					out+=')';
					if (codes.length==4) {
						opacity = codes[3];
						if (!self.Parse.isNumeric(opacity)) {
							error='opacity ['+opacity+'] is not a number';
						}
					}
				} else {
					error='too few/many parts';
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
			var lines= s.replace(/(px|\%|\))\s*,/ig, '$1\u000B').split('\u000B');
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

			createShadow: function(param) {
				var c=param.c,p=param.p,addToFilter=param.addToFilter, i=param.i,
					input=(param.input ? param.input : 'SourceGraphic');
				
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

				var filter=0,
					bottomLayer=input,
					finalResult='',
					bottomLayer0='SourceAlpha',
					bottomLayerA='SourceAlpha';
				
				if (!addToFilter) {
					filter=self.SVG.createElement(NS,'filter');
					filter.setAttributeNS(null,'id',p.id);
				} else {
					bottomLayer='SourceGraphic';
					bottomLayerA=bottomLayer0='SourceAlpha';
					bottomLayer='SourceAlpha';
					filter=addToFilter;
				}

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
				feGaussianBlur.setAttributeNS(null,'in',bottomLayerA);
				feGaussianBlur.setAttributeNS(null,'stdDeviation',obj.deviation);
				console.log(obj.deviation);
				var feOffset = self.SVG.createElement(NS,'feOffset');
				feOffset.setAttributeNS(null,'dx',p.dx);
				feOffset.setAttributeNS(null,'dy',p.dy);
				
				if ( p.inset === false ) {
					finalResult='offsetblur'+i;
					feOffset.setAttributeNS(null,'result',finalResult);
					
					var feFlood = self.SVG.createElement(NS,'feFlood');
					feFlood.setAttributeNS(null,'flood-color',p.color);
					feFlood.setAttributeNS(null,'flood-opacity',p.opacity);
										
					var feComposite = self.SVG.createElement(NS,'feComposite');
					feComposite.setAttributeNS(null,'in2',finalResult);
					feComposite.setAttributeNS(null,'operator','in');
					var feMerge = self.SVG.createElement(NS,'feMerge');
					var feMergeNode0 = self.SVG.createElement(NS,'feMergeNode');
					var feMergeNode1 = self.SVG.createElement(NS,'feMergeNode');
					feMergeNode1.setAttributeNS(null,'in',bottomLayer);
					
					
					filter.appendChild(feGaussianBlur);
					filter.appendChild(feOffset);
					filter.appendChild(feFlood);
					filter.appendChild(feComposite);

					feMerge.appendChild(feMergeNode0);
					feMerge.appendChild(feMergeNode1);
					filter.appendChild(feMerge);

				} else {
					feGaussianBlur.setAttributeNS(null,'result','blur'+i);

					var feComposite0 = self.SVG.createElement(NS,'feComposite');
					feComposite0.setAttributeNS(null,'in2',bottomLayer0);
					feComposite0.setAttributeNS(null,'operator','arithmetic');
					feComposite0.setAttributeNS(null,'k2',-1.4);
					feComposite0.setAttributeNS(null,'k3',1.4);
					
					finalResult='shadowDiff'+i;
					feComposite0.setAttributeNS(null,'result',finalResult);

					var feFlood = self.SVG.createElement(NS,'feFlood');
					feFlood.setAttributeNS(null,'flood-color',p.color);
					feFlood.setAttributeNS(null,'flood-opacity',p.opacity);
					
					var feComposite1 = self.SVG.createElement(NS,'feComposite');
					feComposite1.setAttributeNS(null,'in2',finalResult);
					feComposite1.setAttributeNS(null,'operator','in');
					var feComposite2 = self.SVG.createElement(NS,'feComposite');
					feComposite2.setAttributeNS(null,'in2',bottomLayer);
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
				return { result:finalResult, filter:filter };
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
								error+=(tmp.error ? 1 : 0);
								if (error) {
									self.Utility.perror('malformed: '+tmp.error+' IN "'+value+'"');
								}
								value = tmp.color;
								out['opacity'] = tmp.opacity;
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
			console.log(lists);
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
				eid=self.Utility.attr(elem,'id'),
				ID='csstosvg-'+(eid ? eid : Math.floor(Math.random()*1000000)),
				addToFilter = false,
				input = false;

			for (var i=0; i < params.group.length; i++) {
				d=params.group[i];
				console.log(d);
			
				var	opacity=(d.opacity ? d.opacity : 1),			
					negX='-100%', negY='-100%',
					widthPercent=300,
					deviation=1,
					objWidth=0,
					deviationIsPercent=self.Parse.isPercent(d.blurRadius);

				if (!(objWidth=parseInt( self.Utility.attr(elem,'r')))) {
					objWidth=Math.round((self.Utility.attr(elem,'width')+self.Utility.attr(elem,'height'))/2);
				}

				if (d.blurRadius) {
					var bINT=parseInt(d.blurRadius);
					if (deviationIsPercent) {
						deviation = Math.round(0.5 * bINT * objWidth);
					} else {
						deviation = 0.5 * bINT;
					}
				}

				if (d.spreadRadius) {
					var dINT=parseInt(deviation),
						spread=parseInt(d.spreadRadius),
						spreadIsPercent = self.Parse.isPercent(d.spreadRadius);					
					if (spreadIsPercent) {
						deviation += Math.round(0.5 * spread * objWidth);
					} else {
						deviation += 0.5*spread;
					}
				}
			
				if (d.inset === true) {
					negX=0;
					negY=0;
					widthPercent-=70;
					deviation=6.5;
				}
				var width=widthPercent+'%',
					height=widthPercent+'%';

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
				
				var params2={
					c:context,
					p:obj,
					addToFilter:addToFilter,
					i:i,
					input:input
				},
				ret=self.SVG.createShadow(params2);
			
				addToFilter = ret.filter;
				input = ret.result;
			}
			self.Utility.setAttr(elem,'filter','url(#'+ID+')');	
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
