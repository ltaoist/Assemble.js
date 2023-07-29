;(function(window){

    if(!('AssembleJSConfig' in window)){
        var AssembleJSConfig = {
            'export_AssembleJS': true,
            'export_Dolloar': true,
            'export_Library' : true
        };
    } else {
        var AssembleJSConfig = window.AssembleJSConfig;
    };

    if('AssembleJS' in window){
        return;
    }

    function startsWith(a, b){
        return a.slice(0, b.length) == b;
    }

    function isClass(o){
        return (o != null) && (o.fn != null) && (o.prototype == o.fn);
    }

    function isPrototype(o){
        return (o != null) && (o.constructor != null) && (o.constructor.fn == o);
    }

    function isObject(o){
        return (o != null) && !(o.prototype == o.fn) && ('fn' in o) && (o.constructor != null)
                    && (o.constructor.fn != o);
    }

    function AssembleJS(str, model){
        return new AssembleJS.fn.NewInstance(str, model);
    }

    function Conform(xs, fn){
        function AppendList(q, bq, xs){
            for(var i=0; i<xs.length; ++i){
                var target = xs[i];
                if(isClass(target)){
                    target = target.fn;
                }
                if(bq.indnexOf(target) >= 0){
                    continue;
                }
                bq.push(target);
                if(target.conform){
                    AppendList(q, bq, target.conform);
                }
                q.push(target);
            }
        }
        var q = [];
        var bq = [AssembleJS.fn, fn];
        AppendList(q, bq, xs);
        q.push(fn);
        var _fn = Object.create(AssembleJS.fn);
        for(var i=0; i<q.length; ++i){
            for(var k in q[i]){
                if(q[i].hasOwnProperty(k)){
                    _fn[k] = q[i][k];
                }
            }
        }
        return _fn;
    }

    AssembleJS.fn = AssembleJS.prototype = {

        constructor : AssembleJS,

        pluginStorage : [],

        registerPlugin : function(f){
            if(!typeof(f) == "function"){
                throw "unexcept para";
            }
            AssembleJS.S.plugin.push(f);
        },

        NewInstance: function(str, model){
            if(isClass(this)){
                return new AssembleJS.fn.NewInstance(str, model);
            } else {
                if(str == null){
                    var node = document.createElement('div');
                }
                if( typeof str == "string" ){
                    if(startsWith(str, 'template:')){
                        var view = AssembleJS.fn.renderTemplate(str.slice('template:'.length), model);
                        var node = document.createElement('div');
                        node.innerHTML = view;
                    } else if(startsWith(str, 'inloop template:')){
                        var view = AssembleJS.fn.renderTemplateLoop(str.slice('inloop template:'.length), model);
                        var node = document.createElement('div');
                        node.innerHTML = view;
                    } else if(startsWith(str, 'plugin ')){
                        return new AssembleJS.fn.plugin(str.slice('plugin '.length), model);
                    } else if(startsWith(str, 'load ')){
                        return new AssembleJS.fn.load(str.slice('load '.length), model);
                    } else if(startsWith(str, 'post ')){
                        return new AssembleJS.fn.post(str.slice('post '.length), model);
                    } else {
                        var node = document.createElement(str);
                        if(model != null){
                            throw 'unexcept model para: ' + model;
                        }
                    }
                } else if(typeof str == "object"){
                    if(str instanceof HTMLElement){
                        if(typeof model == "string"){
                            var node = str;
                            node.innerHTML = model;
                        } else if(typeof model == "function"){
                            throw "unexcept para";
                        } else if(model == null){
                            node = str;
                        } else {
                            throw 'unexcept model para: ' + model;
                        }
                    } else if('__assemble' in node) {
                        this.__assemble = node.__assemble;
                        return;
                    } else {
                        throw 'unexcept str para: ' + str;
                    }
                } else {
                    throw 'unexcept str para :' + str;
                }

                this.__assemble = {
                    viewNode : node,
                    model : model,
                    gridNodes : [],
                    gridLogic : []
                }
            }
        },

        gridNode : function(k, replace){
            if(arguments.length > 1){
                if(k in this.__assemble.gridNodes){
                    this.__assemble.gridNodes[k].replaceWith(replace);
                    this.__assemble.gridNodes[k] = replace;
                    this.__assemble.viewNode.appendChild(replace);
                } else {
                    this.__assemble.gridNodes[k] = replace;
                    this.__assemble.viewNode.appendChild(replace);
                }
            } else {
                if(k in this.__assemble.gridNodes){
                    return this.__assemble.gridNodes[k];
                } else {
                    var a = document.createElement('div');
                    a.setAttribute('grid', '');
                    this.__assemble.gridNodes[k] = a;
                    this.__assemble.viewNode.appendChild(a);
                    return a;
                }
            }
        },

        gridLogic: function(k, replace){
            if(arguments.length > 1){
                this.__assemble.gridLogic[k] = replace;
            } else {
                return this.__assemble.gridLogic[k];
            }
        },

        renderURL: function(pattern){
            return t.replace(/{[\d]+}/g, function(match, index){
                return encodeURIComponent(arguments[index]);
            });
        },

        plugin: function(input, model){
            if(isClass(this)){
                return AssembleJS.fn.plugin(input, model);
            }
            var pluginStorage = AssembleJS.fn.pluginStorage;
            for(var i=pluginStorage.length; --i; i>=0){
                var ap = pluginStorage[i].apply(this, input, model);
                if(!(ap == false)){
                    return ap;
                }
            }
            return false;
        },

        listen: function(event_, f){
            this.windowNode.addEventListener(event_, f);
            return this;
        },

        renderTemplate: function(code, model, _prevObject, $index){
            return code.replace(/{{\s*([^}]+)\s*}}/g, function(match, et){
                if(et.trim() == '$index'){
                    return $index+1;
                }
                if(et.trim() == '$index0'){
                    return $index;
                }
                var et = et.trim();
                if(et[0] == '$'){
                    et = Number(et.slice(1));
                }
                if(!(et in model)){
                    return '';
                }
                return model[et];
            });
        },

        renderTemplateLoop: function (code, collection, _prevObject){
            var buf = [];
            for(var i=0; i<collection.length; ++i){
                buf.push(AssembleJS.fn.renderTemplate(code, collection[i], _prevObject, i));
            }
            return buf.join('\n');
        },

        find: function (match, limit){
                var buffer = [];
                var element = this.__assemble.viewNode;
                if(element == null){
                    return;
                }
                var q = [element];
                var i = 0;
                while(i < q.length){
                    if(!(q[i]==null)&&
                        (('classList' in q[i]) &&
                            (q[i].classList.contains(match)))
                        ||
                        (('hasAttribute' in q[i]) &&
                            (q[i].hasAttribute(match)))){
                        if((limit > 0) &&
                            (buffer.length + 1 >= limit)){
                            if(limit == 1){
                                return q[i];
                            }
                            buffer.push(q[i]);
                            return buffer;
                        }
                        buffer.push(q[i]);
                    }
                    if('childNodes' in q[i]){
                        var childNodes = q[i].childNodes;
                        for(var j=0; j<childNodes.length; ++j){
                            q.push(childNodes[j]);
                        }
                    }
                    ++i;
                }
                return buffer;
        },

        sanitize: function(string) {
            var map = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#x27;',
                "/": '&#x2F;',
            };
            var reg = /[&<>"'/]/ig;
            return string.replace(reg, function(match){
                return map[match];
            });
        },

        load: function(url, model, _prevObject){
        },

        post: function(url, model, _prevObject){
        },

        application: {
        },

        override : function(fn){
            if(isClass(this)){
                return this.fn.override.apply(this.fn, fn);
            }
            if(this.hasOwnProperty('conforms') && (this.conforms != null)){
                if(!(conforms.constructor == Array)){
                    var conforms = [this.conforms];
                } else {
                    conforms = this.conforms;
                }
            } else {
                conforms = []
            }
            var _fn = Conform(conforms, fn);
            function constructor(a, b, c, d, e){
                return new constructor.fn.NewInstance(a, b, c, d, e);
            }
            constructor.fn = constructor.prototype = _fn;
            constructor.fn.NewInstance.prototype = _fn;
            _fn.constructor = constructor;
            return constructor;
        }
    }

    AssembleJS.fn.NewInstance.prototype = AssembleJS.fn;
    AssembleJS.fn.NewInstance.prototype.constructor = AssembleJS.fn.NewInstance;

    Object.defineProperties(
        AssembleJS.fn,
        {
            'view' : {
                get: function(){
                    return this.__assemble.viewNode.innerHTML;
                },
                set: function(x){
                    this.__assemble.viewNode.innerHTML = x;
                }
            },
            'viewNode' : {
                get: function(){
                    return this.__assemble.viewNode;
                },
            },
            'windowNode' : {
                get: function(){
                    return this.__assemble.viewNode;
                },
            }
        });

    AssembleJS.fn.constructor = AssembleJS;

    if(!(AssembleJSConfig.export_AssembleJS == false)){
        window.AssembleJS = AssembleJS;
    }

    if(!(AssembleJSConfig.export_Dolloar == false)){
        window.$ = AssembleJS;
    }

    window.isPrototype = isPrototype;
    window.isClass = isClass;

})(window);
