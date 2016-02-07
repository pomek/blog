/* http://prismjs.com/download.html?themes=prism-coy&languages=markup+css+clike+javascript+apacheconf+bash+c+csharp+cpp+coffeescript+css-extras+diff+docker+gherkin+git+go+handlebars+http+jade+java+json+less+makefile+markdown+nginx+php+puppet+python+jsx+sass+sql+twig+yaml&plugins=line-numbers+autolinker */
var _self = (typeof window !== 'undefined')
    ? window   // if in browser
    : (
    (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope)
        ? self // if in worker
        : {}   // if in node js
);

/**
 * Prism: Lightweight, robust, elegant syntax highlighting
 * MIT license http://www.opensource.org/licenses/mit-license.php/
 * @author Lea Verou http://lea.verou.me
 */

var Prism = (function(){

    // Private helper vars
    var lang = /\blang(?:uage)?-(\w+)\b/i;
    var uniqueId = 0;

    var _ = _self.Prism = {
        util: {
            encode: function (tokens) {
                if (tokens instanceof Token) {
                    return new Token(tokens.type, _.util.encode(tokens.content), tokens.alias);
                } else if (_.util.type(tokens) === 'Array') {
                    return tokens.map(_.util.encode);
                } else {
                    return tokens.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\u00a0/g, ' ');
                }
            },

            type: function (o) {
                return Object.prototype.toString.call(o).match(/\[object (\w+)\]/)[1];
            },

            objId: function (obj) {
                if (!obj['__id']) {
                    Object.defineProperty(obj, '__id', { value: ++uniqueId });
                }
                return obj['__id'];
            },

            // Deep clone a language definition (e.g. to extend it)
            clone: function (o) {
                var type = _.util.type(o);

                switch (type) {
                    case 'Object':
                        var clone = {};

                        for (var key in o) {
                            if (o.hasOwnProperty(key)) {
                                clone[key] = _.util.clone(o[key]);
                            }
                        }

                        return clone;

                    case 'Array':
                        // Check for existence for IE8
                        return o.map && o.map(function(v) { return _.util.clone(v); });
                }

                return o;
            }
        },

        languages: {
            extend: function (id, redef) {
                var lang = _.util.clone(_.languages[id]);

                for (var key in redef) {
                    lang[key] = redef[key];
                }

                return lang;
            },

            /**
             * Insert a token before another token in a language literal
             * As this needs to recreate the object (we cannot actually insert before keys in object literals),
             * we cannot just provide an object, we need anobject and a key.
             * @param inside The key (or language id) of the parent
             * @param before The key to insert before. If not provided, the function appends instead.
             * @param insert Object with the key/value pairs to insert
             * @param root The object that contains `inside`. If equal to Prism.languages, it can be omitted.
             */
            insertBefore: function (inside, before, insert, root) {
                root = root || _.languages;
                var grammar = root[inside];

                if (arguments.length == 2) {
                    insert = arguments[1];

                    for (var newToken in insert) {
                        if (insert.hasOwnProperty(newToken)) {
                            grammar[newToken] = insert[newToken];
                        }
                    }

                    return grammar;
                }

                var ret = {};

                for (var token in grammar) {

                    if (grammar.hasOwnProperty(token)) {

                        if (token == before) {

                            for (var newToken in insert) {

                                if (insert.hasOwnProperty(newToken)) {
                                    ret[newToken] = insert[newToken];
                                }
                            }
                        }

                        ret[token] = grammar[token];
                    }
                }

                // Update references in other language definitions
                _.languages.DFS(_.languages, function(key, value) {
                    if (value === root[inside] && key != inside) {
                        this[key] = ret;
                    }
                });

                return root[inside] = ret;
            },

            // Traverse a language definition with Depth First Search
            DFS: function(o, callback, type, visited) {
                visited = visited || {};
                for (var i in o) {
                    if (o.hasOwnProperty(i)) {
                        callback.call(o, i, o[i], type || i);

                        if (_.util.type(o[i]) === 'Object' && !visited[_.util.objId(o[i])]) {
                            visited[_.util.objId(o[i])] = true;
                            _.languages.DFS(o[i], callback, null, visited);
                        }
                        else if (_.util.type(o[i]) === 'Array' && !visited[_.util.objId(o[i])]) {
                            visited[_.util.objId(o[i])] = true;
                            _.languages.DFS(o[i], callback, i, visited);
                        }
                    }
                }
            }
        },
        plugins: {},

        highlightAll: function(async, callback) {
            var elements = document.querySelectorAll('code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code');

            for (var i=0, element; element = elements[i++];) {
                _.highlightElement(element, async === true, callback);
            }
        },

        highlightElement: function(element, async, callback) {
            // Find language
            var language, grammar, parent = element;

            while (parent && !lang.test(parent.className)) {
                parent = parent.parentNode;
            }

            if (parent) {
                language = (parent.className.match(lang) || [,''])[1];
                grammar = _.languages[language];
            }

            // Set language on the element, if not present
            element.className = element.className.replace(lang, '').replace(/\s+/g, ' ') + ' language-' + language;

            // Set language on the parent, for styling
            parent = element.parentNode;

            if (/pre/i.test(parent.nodeName)) {
                parent.className = parent.className.replace(lang, '').replace(/\s+/g, ' ') + ' language-' + language;
            }

            var code = element.textContent;

            var env = {
                element: element,
                language: language,
                grammar: grammar,
                code: code
            };

            if (!code || !grammar) {
                _.hooks.run('complete', env);
                return;
            }

            _.hooks.run('before-highlight', env);

            if (async && _self.Worker) {
                var worker = new Worker(_.filename);

                worker.onmessage = function(evt) {
                    env.highlightedCode = evt.data;

                    _.hooks.run('before-insert', env);

                    env.element.innerHTML = env.highlightedCode;

                    callback && callback.call(env.element);
                    _.hooks.run('after-highlight', env);
                    _.hooks.run('complete', env);
                };

                worker.postMessage(JSON.stringify({
                    language: env.language,
                    code: env.code,
                    immediateClose: true
                }));
            }
            else {
                env.highlightedCode = _.highlight(env.code, env.grammar, env.language);

                _.hooks.run('before-insert', env);

                env.element.innerHTML = env.highlightedCode;

                callback && callback.call(element);

                _.hooks.run('after-highlight', env);
                _.hooks.run('complete', env);
            }
        },

        highlight: function (text, grammar, language) {
            var tokens = _.tokenize(text, grammar);
            return Token.stringify(_.util.encode(tokens), language);
        },

        tokenize: function(text, grammar, language) {
            var Token = _.Token;

            var strarr = [text];

            var rest = grammar.rest;

            if (rest) {
                for (var token in rest) {
                    grammar[token] = rest[token];
                }

                delete grammar.rest;
            }

            tokenloop: for (var token in grammar) {
                if(!grammar.hasOwnProperty(token) || !grammar[token]) {
                    continue;
                }

                var patterns = grammar[token];
                patterns = (_.util.type(patterns) === "Array") ? patterns : [patterns];

                for (var j = 0; j < patterns.length; ++j) {
                    var pattern = patterns[j],
                        inside = pattern.inside,
                        lookbehind = !!pattern.lookbehind,
                        lookbehindLength = 0,
                        alias = pattern.alias;

                    pattern = pattern.pattern || pattern;

                    for (var i=0; i<strarr.length; i++) { // Donât cache length as it changes during the loop

                        var str = strarr[i];

                        if (strarr.length > text.length) {
                            // Something went terribly wrong, ABORT, ABORT!
                            break tokenloop;
                        }

                        if (str instanceof Token) {
                            continue;
                        }

                        pattern.lastIndex = 0;

                        var match = pattern.exec(str);

                        if (match) {
                            if(lookbehind) {
                                lookbehindLength = match[1].length;
                            }

                            var from = match.index - 1 + lookbehindLength,
                                match = match[0].slice(lookbehindLength),
                                len = match.length,
                                to = from + len,
                                before = str.slice(0, from + 1),
                                after = str.slice(to + 1);

                            var args = [i, 1];

                            if (before) {
                                args.push(before);
                            }

                            var wrapped = new Token(token, inside? _.tokenize(match, inside) : match, alias);

                            args.push(wrapped);

                            if (after) {
                                args.push(after);
                            }

                            Array.prototype.splice.apply(strarr, args);
                        }
                    }
                }
            }

            return strarr;
        },

        hooks: {
            all: {},

            add: function (name, callback) {
                var hooks = _.hooks.all;

                hooks[name] = hooks[name] || [];

                hooks[name].push(callback);
            },

            run: function (name, env) {
                var callbacks = _.hooks.all[name];

                if (!callbacks || !callbacks.length) {
                    return;
                }

                for (var i=0, callback; callback = callbacks[i++];) {
                    callback(env);
                }
            }
        }
    };

    var Token = _.Token = function(type, content, alias) {
        this.type = type;
        this.content = content;
        this.alias = alias;
    };

    Token.stringify = function(o, language, parent) {
        if (typeof o == 'string') {
            return o;
        }

        if (_.util.type(o) === 'Array') {
            return o.map(function(element) {
                return Token.stringify(element, language, o);
            }).join('');
        }

        var env = {
            type: o.type,
            content: Token.stringify(o.content, language, parent),
            tag: 'span',
            classes: ['token', o.type],
            attributes: {},
            language: language,
            parent: parent
        };

        if (env.type == 'comment') {
            env.attributes['spellcheck'] = 'true';
        }

        if (o.alias) {
            var aliases = _.util.type(o.alias) === 'Array' ? o.alias : [o.alias];
            Array.prototype.push.apply(env.classes, aliases);
        }

        _.hooks.run('wrap', env);

        var attributes = '';

        for (var name in env.attributes) {
            attributes += (attributes ? ' ' : '') + name + '="' + (env.attributes[name] || '') + '"';
        }

        return '<' + env.tag + ' class="' + env.classes.join(' ') + '" ' + attributes + '>' + env.content + '</' + env.tag + '>';

    };

    if (!_self.document) {
        if (!_self.addEventListener) {
            // in Node.js
            return _self.Prism;
        }
        // In worker
        _self.addEventListener('message', function(evt) {
            var message = JSON.parse(evt.data),
                lang = message.language,
                code = message.code,
                immediateClose = message.immediateClose;

            _self.postMessage(_.highlight(code, _.languages[lang], lang));
            if (immediateClose) {
                _self.close();
            }
        }, false);

        return _self.Prism;
    }

    //Get current script and highlight
    var script = document.currentScript || [].slice.call(document.getElementsByTagName("script")).pop();

    if (script) {
        _.filename = script.src;

        if (document.addEventListener && !script.hasAttribute('data-manual')) {
            document.addEventListener('DOMContentLoaded', _.highlightAll);
        }
    }

    return _self.Prism;

})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Prism;
}

// hack for components to work correctly in node.js
if (typeof global !== 'undefined') {
    global.Prism = Prism;
}
;
Prism.languages.markup = {
    'comment': /<!--[\w\W]*?-->/,
    'prolog': /<\?[\w\W]+?\?>/,
    'doctype': /<!DOCTYPE[\w\W]+?>/,
    'cdata': /<!\[CDATA\[[\w\W]*?]]>/i,
    'tag': {
        pattern: /<\/?(?!\d)[^\s>\/=.$<]+(?:\s+[^\s>\/=]+(?:=(?:("|')(?:\\\1|\\?(?!\1)[\w\W])*\1|[^\s'">=]+))?)*\s*\/?>/i,
        inside: {
            'tag': {
                pattern: /^<\/?[^\s>\/]+/i,
                inside: {
                    'punctuation': /^<\/?/,
                    'namespace': /^[^\s>\/:]+:/
                }
            },
            'attr-value': {
                pattern: /=(?:('|")[\w\W]*?(\1)|[^\s>]+)/i,
                inside: {
                    'punctuation': /[=>"']/
                }
            },
            'punctuation': /\/?>/,
            'attr-name': {
                pattern: /[^\s>\/]+/,
                inside: {
                    'namespace': /^[^\s>\/:]+:/
                }
            }

        }
    },
    'entity': /&#?[\da-z]{1,8};/i
};

// Plugin to make entity title show the real entity, idea by Roman Komarov
Prism.hooks.add('wrap', function(env) {

    if (env.type === 'entity') {
        env.attributes['title'] = env.content.replace(/&amp;/, '&');
    }
});

Prism.languages.xml = Prism.languages.markup;
Prism.languages.html = Prism.languages.markup;
Prism.languages.mathml = Prism.languages.markup;
Prism.languages.svg = Prism.languages.markup;

Prism.languages.css = {
    'comment': /\/\*[\w\W]*?\*\//,
    'atrule': {
        pattern: /@[\w-]+?.*?(;|(?=\s*\{))/i,
        inside: {
            'rule': /@[\w-]+/
            // See rest below
        }
    },
    'url': /url\((?:(["'])(\\(?:\r\n|[\w\W])|(?!\1)[^\\\r\n])*\1|.*?)\)/i,
    'selector': /[^\{\}\s][^\{\};]*?(?=\s*\{)/,
    'string': /("|')(\\(?:\r\n|[\w\W])|(?!\1)[^\\\r\n])*\1/,
    'property': /(\b|\B)[\w-]+(?=\s*:)/i,
    'important': /\B!important\b/i,
    'function': /[-a-z0-9]+(?=\()/i,
    'punctuation': /[(){};:]/
};

Prism.languages.css['atrule'].inside.rest = Prism.util.clone(Prism.languages.css);

if (Prism.languages.markup) {
    Prism.languages.insertBefore('markup', 'tag', {
        'style': {
            pattern: /(<style[\w\W]*?>)[\w\W]*?(?=<\/style>)/i,
            lookbehind: true,
            inside: Prism.languages.css,
            alias: 'language-css'
        }
    });

    Prism.languages.insertBefore('inside', 'attr-value', {
        'style-attr': {
            pattern: /\s*style=("|').*?\1/i,
            inside: {
                'attr-name': {
                    pattern: /^\s*style/i,
                    inside: Prism.languages.markup.tag.inside
                },
                'punctuation': /^\s*=\s*['"]|['"]\s*$/,
                'attr-value': {
                    pattern: /.+/i,
                    inside: Prism.languages.css
                }
            },
            alias: 'language-css'
        }
    }, Prism.languages.markup.tag);
};
Prism.languages.clike = {
    'comment': [
        {
            pattern: /(^|[^\\])\/\*[\w\W]*?\*\//,
            lookbehind: true
        },
        {
            pattern: /(^|[^\\:])\/\/.*/,
            lookbehind: true
        }
    ],
    'string': /(["'])(\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
    'class-name': {
        pattern: /((?:\b(?:class|interface|extends|implements|trait|instanceof|new)\s+)|(?:catch\s+\())[a-z0-9_\.\\]+/i,
        lookbehind: true,
        inside: {
            punctuation: /(\.|\\)/
        }
    },
    'keyword': /\b(if|else|while|do|for|return|in|instanceof|function|new|try|throw|catch|finally|null|break|continue)\b/,
    'boolean': /\b(true|false)\b/,
    'function': /[a-z0-9_]+(?=\()/i,
    'number': /\b-?(?:0x[\da-f]+|\d*\.?\d+(?:e[+-]?\d+)?)\b/i,
    'operator': /--?|\+\+?|!=?=?|<=?|>=?|==?=?|&&?|\|\|?|\?|\*|\/|~|\^|%/,
    'punctuation': /[{}[\];(),.:]/
};

Prism.languages.javascript = Prism.languages.extend('clike', {
    'keyword': /\b(as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|var|void|while|with|yield)\b/,
    'number': /\b-?(0x[\dA-Fa-f]+|0b[01]+|0o[0-7]+|\d*\.?\d+([Ee][+-]?\d+)?|NaN|Infinity)\b/,
    // Allow for all non-ASCII characters (See http://stackoverflow.com/a/2008444)
    'function': /[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*(?=\()/i
});

Prism.languages.insertBefore('javascript', 'keyword', {
    'regex': {
        pattern: /(^|[^/])\/(?!\/)(\[.+?]|\\.|[^/\\\r\n])+\/[gimyu]{0,5}(?=\s*($|[\r\n,.;})]))/,
        lookbehind: true
    }
});

Prism.languages.insertBefore('javascript', 'class-name', {
    'template-string': {
        pattern: /`(?:\\`|\\?[^`])*`/,
        inside: {
            'interpolation': {
                pattern: /\$\{[^}]+\}/,
                inside: {
                    'interpolation-punctuation': {
                        pattern: /^\$\{|\}$/,
                        alias: 'punctuation'
                    },
                    rest: Prism.languages.javascript
                }
            },
            'string': /[\s\S]+/
        }
    }
});

if (Prism.languages.markup) {
    Prism.languages.insertBefore('markup', 'tag', {
        'script': {
            pattern: /(<script[\w\W]*?>)[\w\W]*?(?=<\/script>)/i,
            lookbehind: true,
            inside: Prism.languages.javascript,
            alias: 'language-javascript'
        }
    });
}

Prism.languages.js = Prism.languages.javascript;
Prism.languages.apacheconf = {
    'comment': /#.*/,
    'directive-inline': {
        pattern: /^(\s*)\b(AcceptFilter|AcceptPathInfo|AccessFileName|Action|AddAlt|AddAltByEncoding|AddAltByType|AddCharset|AddDefaultCharset|AddDescription|AddEncoding|AddHandler|AddIcon|AddIconByEncoding|AddIconByType|AddInputFilter|AddLanguage|AddModuleInfo|AddOutputFilter|AddOutputFilterByType|AddType|Alias|AliasMatch|Allow|AllowCONNECT|AllowEncodedSlashes|AllowMethods|AllowOverride|AllowOverrideList|Anonymous|Anonymous_LogEmail|Anonymous_MustGiveEmail|Anonymous_NoUserID|Anonymous_VerifyEmail|AsyncRequestWorkerFactor|AuthBasicAuthoritative|AuthBasicFake|AuthBasicProvider|AuthBasicUseDigestAlgorithm|AuthDBDUserPWQuery|AuthDBDUserRealmQuery|AuthDBMGroupFile|AuthDBMType|AuthDBMUserFile|AuthDigestAlgorithm|AuthDigestDomain|AuthDigestNonceLifetime|AuthDigestProvider|AuthDigestQop|AuthDigestShmemSize|AuthFormAuthoritative|AuthFormBody|AuthFormDisableNoStore|AuthFormFakeBasicAuth|AuthFormLocation|AuthFormLoginRequiredLocation|AuthFormLoginSuccessLocation|AuthFormLogoutLocation|AuthFormMethod|AuthFormMimetype|AuthFormPassword|AuthFormProvider|AuthFormSitePassphrase|AuthFormSize|AuthFormUsername|AuthGroupFile|AuthLDAPAuthorizePrefix|AuthLDAPBindAuthoritative|AuthLDAPBindDN|AuthLDAPBindPassword|AuthLDAPCharsetConfig|AuthLDAPCompareAsUser|AuthLDAPCompareDNOnServer|AuthLDAPDereferenceAliases|AuthLDAPGroupAttribute|AuthLDAPGroupAttributeIsDN|AuthLDAPInitialBindAsUser|AuthLDAPInitialBindPattern|AuthLDAPMaxSubGroupDepth|AuthLDAPRemoteUserAttribute|AuthLDAPRemoteUserIsDN|AuthLDAPSearchAsUser|AuthLDAPSubGroupAttribute|AuthLDAPSubGroupClass|AuthLDAPUrl|AuthMerging|AuthName|AuthnCacheContext|AuthnCacheEnable|AuthnCacheProvideFor|AuthnCacheSOCache|AuthnCacheTimeout|AuthnzFcgiCheckAuthnProvider|AuthnzFcgiDefineProvider|AuthType|AuthUserFile|AuthzDBDLoginToReferer|AuthzDBDQuery|AuthzDBDRedirectQuery|AuthzDBMType|AuthzSendForbiddenOnFailure|BalancerGrowth|BalancerInherit|BalancerMember|BalancerPersist|BrowserMatch|BrowserMatchNoCase|BufferedLogs|BufferSize|CacheDefaultExpire|CacheDetailHeader|CacheDirLength|CacheDirLevels|CacheDisable|CacheEnable|CacheFile|CacheHeader|CacheIgnoreCacheControl|CacheIgnoreHeaders|CacheIgnoreNoLastMod|CacheIgnoreQueryString|CacheIgnoreURLSessionIdentifiers|CacheKeyBaseURL|CacheLastModifiedFactor|CacheLock|CacheLockMaxAge|CacheLockPath|CacheMaxExpire|CacheMaxFileSize|CacheMinExpire|CacheMinFileSize|CacheNegotiatedDocs|CacheQuickHandler|CacheReadSize|CacheReadTime|CacheRoot|CacheSocache|CacheSocacheMaxSize|CacheSocacheMaxTime|CacheSocacheMinTime|CacheSocacheReadSize|CacheSocacheReadTime|CacheStaleOnError|CacheStoreExpired|CacheStoreNoStore|CacheStorePrivate|CGIDScriptTimeout|CGIMapExtension|CharsetDefault|CharsetOptions|CharsetSourceEnc|CheckCaseOnly|CheckSpelling|ChrootDir|ContentDigest|CookieDomain|CookieExpires|CookieName|CookieStyle|CookieTracking|CoreDumpDirectory|CustomLog|Dav|DavDepthInfinity|DavGenericLockDB|DavLockDB|DavMinTimeout|DBDExptime|DBDInitSQL|DBDKeep|DBDMax|DBDMin|DBDParams|DBDPersist|DBDPrepareSQL|DBDriver|DefaultIcon|DefaultLanguage|DefaultRuntimeDir|DefaultType|Define|DeflateBufferSize|DeflateCompressionLevel|DeflateFilterNote|DeflateInflateLimitRequestBody|DeflateInflateRatioBurst|DeflateInflateRatioLimit|DeflateMemLevel|DeflateWindowSize|Deny|DirectoryCheckHandler|DirectoryIndex|DirectoryIndexRedirect|DirectorySlash|DocumentRoot|DTracePrivileges|DumpIOInput|DumpIOOutput|EnableExceptionHook|EnableMMAP|EnableSendfile|Error|ErrorDocument|ErrorLog|ErrorLogFormat|Example|ExpiresActive|ExpiresByType|ExpiresDefault|ExtendedStatus|ExtFilterDefine|ExtFilterOptions|FallbackResource|FileETag|FilterChain|FilterDeclare|FilterProtocol|FilterProvider|FilterTrace|ForceLanguagePriority|ForceType|ForensicLog|GprofDir|GracefulShutdownTimeout|Group|Header|HeaderName|HeartbeatAddress|HeartbeatListen|HeartbeatMaxServers|HeartbeatStorage|HeartbeatStorage|HostnameLookups|IdentityCheck|IdentityCheckTimeout|ImapBase|ImapDefault|ImapMenu|Include|IncludeOptional|IndexHeadInsert|IndexIgnore|IndexIgnoreReset|IndexOptions|IndexOrderDefault|IndexStyleSheet|InputSed|ISAPIAppendLogToErrors|ISAPIAppendLogToQuery|ISAPICacheFile|ISAPIFakeAsync|ISAPILogNotSupported|ISAPIReadAheadBuffer|KeepAlive|KeepAliveTimeout|KeptBodySize|LanguagePriority|LDAPCacheEntries|LDAPCacheTTL|LDAPConnectionPoolTTL|LDAPConnectionTimeout|LDAPLibraryDebug|LDAPOpCacheEntries|LDAPOpCacheTTL|LDAPReferralHopLimit|LDAPReferrals|LDAPRetries|LDAPRetryDelay|LDAPSharedCacheFile|LDAPSharedCacheSize|LDAPTimeout|LDAPTrustedClientCert|LDAPTrustedGlobalCert|LDAPTrustedMode|LDAPVerifyServerCert|LimitInternalRecursion|LimitRequestBody|LimitRequestFields|LimitRequestFieldSize|LimitRequestLine|LimitXMLRequestBody|Listen|ListenBackLog|LoadFile|LoadModule|LogFormat|LogLevel|LogMessage|LuaAuthzProvider|LuaCodeCache|LuaHookAccessChecker|LuaHookAuthChecker|LuaHookCheckUserID|LuaHookFixups|LuaHookInsertFilter|LuaHookLog|LuaHookMapToStorage|LuaHookTranslateName|LuaHookTypeChecker|LuaInherit|LuaInputFilter|LuaMapHandler|LuaOutputFilter|LuaPackageCPath|LuaPackagePath|LuaQuickHandler|LuaRoot|LuaScope|MaxConnectionsPerChild|MaxKeepAliveRequests|MaxMemFree|MaxRangeOverlaps|MaxRangeReversals|MaxRanges|MaxRequestWorkers|MaxSpareServers|MaxSpareThreads|MaxThreads|MergeTrailers|MetaDir|MetaFiles|MetaSuffix|MimeMagicFile|MinSpareServers|MinSpareThreads|MMapFile|ModemStandard|ModMimeUsePathInfo|MultiviewsMatch|Mutex|NameVirtualHost|NoProxy|NWSSLTrustedCerts|NWSSLUpgradeable|Options|Order|OutputSed|PassEnv|PidFile|PrivilegesMode|Protocol|ProtocolEcho|ProxyAddHeaders|ProxyBadHeader|ProxyBlock|ProxyDomain|ProxyErrorOverride|ProxyExpressDBMFile|ProxyExpressDBMType|ProxyExpressEnable|ProxyFtpDirCharset|ProxyFtpEscapeWildcards|ProxyFtpListOnWildcard|ProxyHTMLBufSize|ProxyHTMLCharsetOut|ProxyHTMLDocType|ProxyHTMLEnable|ProxyHTMLEvents|ProxyHTMLExtended|ProxyHTMLFixups|ProxyHTMLInterp|ProxyHTMLLinks|ProxyHTMLMeta|ProxyHTMLStripComments|ProxyHTMLURLMap|ProxyIOBufferSize|ProxyMaxForwards|ProxyPass|ProxyPassInherit|ProxyPassInterpolateEnv|ProxyPassMatch|ProxyPassReverse|ProxyPassReverseCookieDomain|ProxyPassReverseCookiePath|ProxyPreserveHost|ProxyReceiveBufferSize|ProxyRemote|ProxyRemoteMatch|ProxyRequests|ProxySCGIInternalRedirect|ProxySCGISendfile|ProxySet|ProxySourceAddress|ProxyStatus|ProxyTimeout|ProxyVia|ReadmeName|ReceiveBufferSize|Redirect|RedirectMatch|RedirectPermanent|RedirectTemp|ReflectorHeader|RemoteIPHeader|RemoteIPInternalProxy|RemoteIPInternalProxyList|RemoteIPProxiesHeader|RemoteIPTrustedProxy|RemoteIPTrustedProxyList|RemoveCharset|RemoveEncoding|RemoveHandler|RemoveInputFilter|RemoveLanguage|RemoveOutputFilter|RemoveType|RequestHeader|RequestReadTimeout|Require|RewriteBase|RewriteCond|RewriteEngine|RewriteMap|RewriteOptions|RewriteRule|RLimitCPU|RLimitMEM|RLimitNPROC|Satisfy|ScoreBoardFile|Script|ScriptAlias|ScriptAliasMatch|ScriptInterpreterSource|ScriptLog|ScriptLogBuffer|ScriptLogLength|ScriptSock|SecureListen|SeeRequestTail|SendBufferSize|ServerAdmin|ServerAlias|ServerLimit|ServerName|ServerPath|ServerRoot|ServerSignature|ServerTokens|Session|SessionCookieName|SessionCookieName2|SessionCookieRemove|SessionCryptoCipher|SessionCryptoDriver|SessionCryptoPassphrase|SessionCryptoPassphraseFile|SessionDBDCookieName|SessionDBDCookieName2|SessionDBDCookieRemove|SessionDBDDeleteLabel|SessionDBDInsertLabel|SessionDBDPerUser|SessionDBDSelectLabel|SessionDBDUpdateLabel|SessionEnv|SessionExclude|SessionHeader|SessionInclude|SessionMaxAge|SetEnv|SetEnvIf|SetEnvIfExpr|SetEnvIfNoCase|SetHandler|SetInputFilter|SetOutputFilter|SSIEndTag|SSIErrorMsg|SSIETag|SSILastModified|SSILegacyExprParser|SSIStartTag|SSITimeFormat|SSIUndefinedEcho|SSLCACertificateFile|SSLCACertificatePath|SSLCADNRequestFile|SSLCADNRequestPath|SSLCARevocationCheck|SSLCARevocationFile|SSLCARevocationPath|SSLCertificateChainFile|SSLCertificateFile|SSLCertificateKeyFile|SSLCipherSuite|SSLCompression|SSLCryptoDevice|SSLEngine|SSLFIPS|SSLHonorCipherOrder|SSLInsecureRenegotiation|SSLOCSPDefaultResponder|SSLOCSPEnable|SSLOCSPOverrideResponder|SSLOCSPResponderTimeout|SSLOCSPResponseMaxAge|SSLOCSPResponseTimeSkew|SSLOCSPUseRequestNonce|SSLOpenSSLConfCmd|SSLOptions|SSLPassPhraseDialog|SSLProtocol|SSLProxyCACertificateFile|SSLProxyCACertificatePath|SSLProxyCARevocationCheck|SSLProxyCARevocationFile|SSLProxyCARevocationPath|SSLProxyCheckPeerCN|SSLProxyCheckPeerExpire|SSLProxyCheckPeerName|SSLProxyCipherSuite|SSLProxyEngine|SSLProxyMachineCertificateChainFile|SSLProxyMachineCertificateFile|SSLProxyMachineCertificatePath|SSLProxyProtocol|SSLProxyVerify|SSLProxyVerifyDepth|SSLRandomSeed|SSLRenegBufferSize|SSLRequire|SSLRequireSSL|SSLSessionCache|SSLSessionCacheTimeout|SSLSessionTicketKeyFile|SSLSRPUnknownUserSeed|SSLSRPVerifierFile|SSLStaplingCache|SSLStaplingErrorCacheTimeout|SSLStaplingFakeTryLater|SSLStaplingForceURL|SSLStaplingResponderTimeout|SSLStaplingResponseMaxAge|SSLStaplingResponseTimeSkew|SSLStaplingReturnResponderErrors|SSLStaplingStandardCacheTimeout|SSLStrictSNIVHostCheck|SSLUserName|SSLUseStapling|SSLVerifyClient|SSLVerifyDepth|StartServers|StartThreads|Substitute|Suexec|SuexecUserGroup|ThreadLimit|ThreadsPerChild|ThreadStackSize|TimeOut|TraceEnable|TransferLog|TypesConfig|UnDefine|UndefMacro|UnsetEnv|Use|UseCanonicalName|UseCanonicalPhysicalPort|User|UserDir|VHostCGIMode|VHostCGIPrivs|VHostGroup|VHostPrivs|VHostSecure|VHostUser|VirtualDocumentRoot|VirtualDocumentRootIP|VirtualScriptAlias|VirtualScriptAliasIP|WatchdogInterval|XBitHack|xml2EncAlias|xml2EncDefault|xml2StartParse)\b/mi,
        lookbehind: true,
        alias: 'property'
    },
    'directive-block': {
        pattern: /<\/?\b(AuthnProviderAlias|AuthzProviderAlias|Directory|DirectoryMatch|Else|ElseIf|Files|FilesMatch|If|IfDefine|IfModule|IfVersion|Limit|LimitExcept|Location|LocationMatch|Macro|Proxy|RequireAll|RequireAny|RequireNone|VirtualHost)\b *.*>/i,
        inside: {
            'directive-block': {
                pattern: /^<\/?\w+/,
                inside: {
                    'punctuation': /^<\/?/
                },
                alias: 'tag'
            },
            'directive-block-parameter': {
                pattern: /.*[^>]/,
                inside: {
                    'punctuation': /:/,
                    'string': {
                        pattern: /("|').*\1/,
                        inside: {
                            'variable': /(\$|%)\{?(\w\.?(\+|\-|:)?)+\}?/
                        }
                    }
                },
                alias: 'attr-value'
            },
            'punctuation': />/
        },
        alias: 'tag'
    },
    'directive-flags': {
        pattern: /\[(\w,?)+\]/,
        alias: 'keyword'
    },
    'string': {
        pattern: /("|').*\1/,
        inside: {
            'variable': /(\$|%)\{?(\w\.?(\+|\-|:)?)+\}?/
        }
    },
    'variable': /(\$|%)\{?(\w\.?(\+|\-|:)?)+\}?/,
    'regex': /\^?.*\$|\^.*\$?/
};

(function(Prism) {
    var insideString = {
        variable: [
            // Arithmetic Environment
            {
                pattern: /\$?\(\([\w\W]+?\)\)/,
                inside: {
                    // If there is a $ sign at the beginning highlight $(( and )) as variable
                    variable: [{
                        pattern: /(^\$\(\([\w\W]+)\)\)/,
                        lookbehind: true
                    },
                        /^\$\(\(/,
                    ],
                    number: /\b-?(?:0x[\dA-Fa-f]+|\d*\.?\d+(?:[Ee]-?\d+)?)\b/,
                    // Operators according to https://www.gnu.org/software/bash/manual/bashref.html#Shell-Arithmetic
                    operator: /--?|-=|\+\+?|\+=|!=?|~|\*\*?|\*=|\/=?|%=?|<<=?|>>=?|<=?|>=?|==?|&&?|&=|\^=?|\|\|?|\|=|\?|:/,
                    // If there is no $ sign at the beginning highlight (( and )) as punctuation
                    punctuation: /\(\(?|\)\)?|,|;/
                }
            },
            // Command Substitution
            {
                pattern: /\$\([^)]+\)|`[^`]+`/,
                inside: {
                    variable: /^\$\(|^`|\)$|`$/
                }
            },
            /\$(?:[a-z0-9_#\?\*!@]+|\{[^}]+\})/i
        ],
    };

    Prism.languages.bash = {
        'shebang': {
            pattern: /^#!\s*\/bin\/bash|^#!\s*\/bin\/sh/,
            alias: 'important'
        },
        'comment': {
            pattern: /(^|[^"{\\])#.*/,
            lookbehind: true
        },
        'string': [
            //Support for Here-Documents https://en.wikipedia.org/wiki/Here_document
            {
                pattern: /((?:^|[^<])<<\s*)(?:"|')?(\w+?)(?:"|')?\s*\r?\n(?:[\s\S])*?\r?\n\2/g,
                lookbehind: true,
                inside: insideString
            },
            {
                pattern: /("|')(?:\\?[\s\S])*?\1/g,
                inside: insideString
            }
        ],
        'variable': insideString.variable,
        // Originally based on http://ss64.com/bash/
        'function': {
            pattern: /(^|\s|;|\||&)(?:alias|apropos|apt-get|aptitude|aspell|awk|basename|bash|bc|bg|builtin|bzip2|cal|cat|cd|cfdisk|chgrp|chmod|chown|chroot|chkconfig|cksum|clear|cmp|comm|command|cp|cron|crontab|csplit|cut|date|dc|dd|ddrescue|df|diff|diff3|dig|dir|dircolors|dirname|dirs|dmesg|du|egrep|eject|enable|env|ethtool|eval|exec|expand|expect|export|expr|fdformat|fdisk|fg|fgrep|file|find|fmt|fold|format|free|fsck|ftp|fuser|gawk|getopts|git|grep|groupadd|groupdel|groupmod|groups|gzip|hash|head|help|hg|history|hostname|htop|iconv|id|ifconfig|ifdown|ifup|import|install|jobs|join|kill|killall|less|link|ln|locate|logname|logout|look|lpc|lpr|lprint|lprintd|lprintq|lprm|ls|lsof|make|man|mkdir|mkfifo|mkisofs|mknod|more|most|mount|mtools|mtr|mv|mmv|nano|netstat|nice|nl|nohup|notify-send|nslookup|open|op|passwd|paste|pathchk|ping|pkill|popd|pr|printcap|printenv|printf|ps|pushd|pv|pwd|quota|quotacheck|quotactl|ram|rar|rcp|read|readarray|readonly|reboot|rename|renice|remsync|rev|rm|rmdir|rsync|screen|scp|sdiff|sed|seq|service|sftp|shift|shopt|shutdown|sleep|slocate|sort|source|split|ssh|stat|strace|su|sudo|sum|suspend|sync|tail|tar|tee|test|time|timeout|times|touch|top|traceroute|trap|tr|tsort|tty|type|ulimit|umask|umount|unalias|uname|unexpand|uniq|units|unrar|unshar|uptime|useradd|userdel|usermod|users|uuencode|uudecode|v|vdir|vi|vmstat|wait|watch|wc|wget|whereis|which|who|whoami|write|xargs|xdg-open|yes|zip)(?=$|\s|;|\||&)/,
            lookbehind: true
        },
        'keyword': {
            pattern: /(^|\s|;|\||&)(?:let|:|\.|if|then|else|elif|fi|for|break|continue|while|in|case|function|select|do|done|until|echo|exit|return|set|declare)(?=$|\s|;|\||&)/,
            lookbehind: true
        },
        'boolean': {
            pattern: /(^|\s|;|\||&)(?:true|false)(?=$|\s|;|\||&)/,
            lookbehind: true
        },
        'operator': /&&?|\|\|?|==?|!=?|<<<?|>>|<=?|>=?|=~/,
        'punctuation': /\$?\(\(?|\)\)?|\.\.|[{}[\];]/
    };

    var inside = insideString.variable[1].inside;
    inside['function'] = Prism.languages.bash['function'];
    inside.keyword = Prism.languages.bash.keyword;
    inside.boolean = Prism.languages.bash.boolean;
    inside.operator = Prism.languages.bash.operator;
    inside.punctuation = Prism.languages.bash.punctuation;
})(Prism);
Prism.languages.c = Prism.languages.extend('clike', {
    'keyword': /\b(asm|typeof|inline|auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|int|long|register|return|short|signed|sizeof|static|struct|switch|typedef|union|unsigned|void|volatile|while)\b/,
    'operator': /\-[>-]?|\+\+?|!=?|<<?=?|>>?=?|==?|&&?|\|?\||[~^%?*\/]/,
    'number': /\b-?(?:0x[\da-f]+|\d*\.?\d+(?:e[+-]?\d+)?)[ful]*\b/i
});

Prism.languages.insertBefore('c', 'string', {
    'macro': {
        // allow for multiline macro definitions
        // spaces after the # character compile fine with gcc
        pattern: /(^\s*)#\s*[a-z]+([^\r\n\\]|\\.|\\(?:\r\n?|\n))*/im,
        lookbehind: true,
        alias: 'property',
        inside: {
            // highlight the path of the include statement as a string
            'string': {
                pattern: /(#\s*include\s*)(<.+?>|("|')(\\?.)+?\3)/,
                lookbehind: true
            },
            // highlight macro directives as keywords
            'directive': {
                pattern: /(#\s*)\b(define|elif|else|endif|error|ifdef|ifndef|if|import|include|line|pragma|undef|using)\b/,
                lookbehind: true,
                alias: 'keyword'
            }
        }
    },
    // highlight predefined macros as constants
    'constant': /\b(__FILE__|__LINE__|__DATE__|__TIME__|__TIMESTAMP__|__func__|EOF|NULL|stdin|stdout|stderr)\b/
});

delete Prism.languages.c['class-name'];
delete Prism.languages.c['boolean'];

Prism.languages.csharp = Prism.languages.extend('clike', {
    'keyword': /\b(abstract|as|async|await|base|bool|break|byte|case|catch|char|checked|class|const|continue|decimal|default|delegate|do|double|else|enum|event|explicit|extern|false|finally|fixed|float|for|foreach|goto|if|implicit|in|int|interface|internal|is|lock|long|namespace|new|null|object|operator|out|override|params|private|protected|public|readonly|ref|return|sbyte|sealed|short|sizeof|stackalloc|static|string|struct|switch|this|throw|true|try|typeof|uint|ulong|unchecked|unsafe|ushort|using|virtual|void|volatile|while|add|alias|ascending|async|await|descending|dynamic|from|get|global|group|into|join|let|orderby|partial|remove|select|set|value|var|where|yield)\b/,
    'string': [
        /@("|')(\1\1|\\\1|\\?(?!\1)[\s\S])*\1/,
        /("|')(\\?.)*?\1/
    ],
    'number': /\b-?(0x[\da-f]+|\d*\.?\d+f?)\b/i
});

Prism.languages.insertBefore('csharp', 'keyword', {
    'preprocessor': {
        pattern: /(^\s*)#.*/m,
        lookbehind: true,
        alias: 'property',
        inside: {
            // highlight preprocessor directives as keywords
            'directive': {
                pattern: /(\s*#)\b(define|elif|else|endif|endregion|error|if|line|pragma|region|undef|warning)\b/,
                lookbehind: true,
                alias: 'keyword'
            }
        }
    }
});

Prism.languages.cpp = Prism.languages.extend('c', {
    'keyword': /\b(alignas|alignof|asm|auto|bool|break|case|catch|char|char16_t|char32_t|class|compl|const|constexpr|const_cast|continue|decltype|default|delete|do|double|dynamic_cast|else|enum|explicit|export|extern|float|for|friend|goto|if|inline|int|long|mutable|namespace|new|noexcept|nullptr|operator|private|protected|public|register|reinterpret_cast|return|short|signed|sizeof|static|static_assert|static_cast|struct|switch|template|this|thread_local|throw|try|typedef|typeid|typename|union|unsigned|using|virtual|void|volatile|wchar_t|while)\b/,
    'boolean': /\b(true|false)\b/,
    'operator': /[-+]{1,2}|!=?|<{1,2}=?|>{1,2}=?|\->|:{1,2}|={1,2}|\^|~|%|&{1,2}|\|?\||\?|\*|\/|\b(and|and_eq|bitand|bitor|not|not_eq|or|or_eq|xor|xor_eq)\b/
});

Prism.languages.insertBefore('cpp', 'keyword', {
    'class-name': {
        pattern: /(class\s+)[a-z0-9_]+/i,
        lookbehind: true
    }
});
(function(Prism) {

    // Ignore comments starting with { to privilege string interpolation highlighting
    var comment = /#(?!\{).+/,
        interpolation = {
            pattern: /#\{[^}]+\}/,
            alias: 'variable'
        };

    Prism.languages.coffeescript = Prism.languages.extend('javascript', {
        'comment': comment,
        'string': [

            // Strings are multiline
            /'(?:\\?[^\\])*?'/,

            {
                // Strings are multiline
                pattern: /"(?:\\?[^\\])*?"/,
                inside: {
                    'interpolation': interpolation
                }
            }
        ],
        'keyword': /\b(and|break|by|catch|class|continue|debugger|delete|do|each|else|extend|extends|false|finally|for|if|in|instanceof|is|isnt|let|loop|namespace|new|no|not|null|of|off|on|or|own|return|super|switch|then|this|throw|true|try|typeof|undefined|unless|until|when|while|window|with|yes|yield)\b/,
        'class-member': {
            pattern: /@(?!\d)\w+/,
            alias: 'variable'
        }
    });

    Prism.languages.insertBefore('coffeescript', 'comment', {
        'multiline-comment': {
            pattern: /###[\s\S]+?###/,
            alias: 'comment'
        },

        // Block regexp can contain comments and interpolation
        'block-regex': {
            pattern: /\/{3}[\s\S]*?\/{3}/,
            alias: 'regex',
            inside: {
                'comment': comment,
                'interpolation': interpolation
            }
        }
    });

    Prism.languages.insertBefore('coffeescript', 'string', {
        'inline-javascript': {
            pattern: /`(?:\\?[\s\S])*?`/,
            inside: {
                'delimiter': {
                    pattern: /^`|`$/,
                    alias: 'punctuation'
                },
                rest: Prism.languages.javascript
            }
        },

        // Block strings
        'multiline-string': [
            {
                pattern: /'''[\s\S]*?'''/,
                alias: 'string'
            },
            {
                pattern: /"""[\s\S]*?"""/,
                alias: 'string',
                inside: {
                    interpolation: interpolation
                }
            }
        ]

    });

    Prism.languages.insertBefore('coffeescript', 'keyword', {
        // Object property
        'property': /(?!\d)\w+(?=\s*:(?!:))/
    });

}(Prism));
Prism.languages.css.selector = {
    pattern: /[^\{\}\s][^\{\}]*(?=\s*\{)/,
    inside: {
        'pseudo-element': /:(?:after|before|first-letter|first-line|selection)|::[-\w]+/,
        'pseudo-class': /:[-\w]+(?:\(.*\))?/,
        'class': /\.[-:\.\w]+/,
        'id': /#[-:\.\w]+/
    }
};

Prism.languages.insertBefore('css', 'function', {
    'hexcode': /#[\da-f]{3,6}/i,
    'entity': /\\[\da-f]{1,8}/i,
    'number': /[\d%\.]+/
});
Prism.languages.diff = {
    'coord': [
        // Match all kinds of coord lines (prefixed by "+++", "---" or "***").
        /^(?:\*{3}|-{3}|\+{3}).*$/m,
        // Match "@@ ... @@" coord lines in unified diff.
        /^@@.*@@$/m,
        // Match coord lines in normal diff (starts with a number).
        /^\d+.*$/m
    ],

    // Match inserted and deleted lines. Support both +/- and >/< styles.
    'deleted': /^[-<].+$/m,
    'inserted': /^[+>].+$/m,

    // Match "different" lines (prefixed with "!") in context diff.
    'diff': {
        'pattern': /^!(?!!).+$/m,
        'alias': 'important'
    }
};
Prism.languages.docker = {
    'keyword': {
        pattern: /(^\s*)(?:ONBUILD|FROM|MAINTAINER|RUN|EXPOSE|ENV|ADD|COPY|VOLUME|USER|WORKDIR|CMD|LABEL|ENTRYPOINT)(?=\s)/mi,
        lookbehind: true
    },
    'string': /("|')(?:(?!\1)[^\\\r\n]|\\(?:\r\n|[\s\S]))*?\1/,
    'comment': /#.*/,
    'punctuation': /---|\.\.\.|[:[\]{}\-,|>?]/
};
Prism.languages.gherkin = {
    'pystring': {
        pattern: /("""|''')[\s\S]+?\1/,
        alias: 'string'
    },
    'comment': {
        pattern: /((^|\r?\n|\r)[ \t]*)#.*/,
        lookbehind: true
    },
    'tag': {
        pattern: /((^|\r?\n|\r)[ \t]*)@\S*/,
        lookbehind: true
    },
    'feature': {
        pattern: /((^|\r?\n|\r)[ \t]*)(Ability|Ahoy matey!|Arwedd|Aspekt|Besigheid Behoefte|Business Need|Caracteristica|CaracterĂ­stica|Egenskab|Egenskap|Eiginleiki|Feature|FÄŤÄa|Fitur|FonctionnalitĂŠ|Fonksyonalite|Funcionalidade|Funcionalitat|Functionalitate|FuncĹŁionalitate|FuncČionalitate|Functionaliteit|Fungsi|Funkcia|Funkcija|FunkcionalitÄte|Funkcionalnost|Funkcja|Funksie|FunktionalitĂ¤t|FunktionalitĂŠit|FunzionalitĂ |Hwaet|HwĂŚt|JellemzĹ|Karakteristik|laH|Lastnost|Mak|Mogucnost|MoguÄnost|Moznosti|MoĹžnosti|OH HAI|Omadus|Ominaisuus|Osobina|Ăzellik|perbogh|poQbogh malja'|Potrzeba biznesowa|PoĹžadavek|PoĹžiadavka|Pretty much|Qap|Qu'meH 'ut|SavybÄ|TĂ­nh nÄng|Trajto|VermoĂŤ|VlastnosĹĽ|WĹaĹciwoĹÄ|ZnaÄilnost|ÎĎÎ˝ÎąĎĎĎÎˇĎÎą|ÎÎľÎšĎÎżĎĎÎłÎŻÎą|ĐĐžĐłŃŃĐ˝ĐžŃŃ|ĐÓŠĐźĐşĐ¸Đ˝ĐťĐľĐş|ĐŃĐžĐąĐ¸Đ˝Đ°|ĐĄĐ˛ĐžĐšŃŃĐ˛Đž|ŇŽĐˇĐľĐ˝ŃÓĐťĐľĐşĐťĐľĐťĐľĐş|Đ¤ŃĐ˝ĐşŃĐ¸ĐžĐ˝Đ°Đť|Đ¤ŃĐ˝ĐşŃĐ¸ĐžĐ˝Đ°ĐťĐ˝ĐžŃŃ|Đ¤ŃĐ˝ĐşŃĐ¸Ń|Đ¤ŃĐ˝ĐşŃŃĐžĐ˝Đ°Đť|×Ş××× ×|ŘŽŘ§ŘľŮŘŠ|ŘŽŘľŮŘľŰŘŞ|ŘľŮŘ§Ř­ŰŘŞ|ÚŠŘ§ŘąŮŘ¨Ř§Řą ÚŠŰ ŘśŘąŮŘąŘŞ|ŮŮŰÚÚŻŰ|ŕ¤°ŕĽŕ¤Ş ŕ¤˛ŕĽŕ¤|ŕ¨ŕ¨žŕ¨¸ŕŠŕ¨ŕ¨¤|ŕ¨¨ŕ¨ŕ¨ś ŕ¨¨ŕŠŕ¨šŕ¨žŕ¨°|ŕ¨ŽŕŠŕ¨šŕ¨žŕ¨ŕ¨Śŕ¨°ŕ¨ž|ŕ°ŕąŕ°Łŕ°Žŕą|ŕ˛šŕłŕ˛ŕłŕ˛ŕ˛ł|ŕ¸ŕ¸§ŕ¸˛ŕ¸Ąŕ¸ŕšŕ¸­ŕ¸ŕ¸ŕ¸˛ŕ¸Łŕ¸ŕ¸˛ŕ¸ŕ¸ŕ¸¸ŕ¸Łŕ¸ŕ¸´ŕ¸|ŕ¸ŕ¸§ŕ¸˛ŕ¸Ąŕ¸Şŕ¸˛ŕ¸Ąŕ¸˛ŕ¸Łŕ¸|ŕšŕ¸ŕ¸Łŕ¸ŕ¸Ťŕ¸Ľŕ¸ąŕ¸|ę¸°ëĽ|ăăŁăźăăŁ|ĺč˝|ćŠč˝):([^:]+(?:\r?\n|\r|$))*/,
        lookbehind: true,
        inside: {
            'important': {
                pattern: /(:)[^\r\n]+/,
                lookbehind: true
            },
            keyword: /[^:\r\n]+:/
        }
    },
    'scenario': {
        pattern: /((^|\r?\n|\r)[ \t]*)(Abstract Scenario|Abstrakt Scenario|Achtergrond|Aer|Ăr|Agtergrond|All y'all|Antecedentes|Antecedents|AtburĂ°arĂĄs|AtburĂ°arĂĄsir|Awww, look mate|B4|Background|Baggrund|Bakgrund|Bakgrunn|Bakgrunnur|Beispiele|Beispiller|Báťi cáşŁnh|Cefndir|Cenario|CenĂĄrio|Cenario de Fundo|CenĂĄrio de Fundo|Cenarios|CenĂĄrios|Contesto|Context|Contexte|Contexto|Conto|Contoh|Contone|DĂŚmi|Dasar|Dead men tell no tales|Delineacao do Cenario|DelineaĂ§ĂŁo do CenĂĄrio|Dis is what went down|DáťŻ liáťu|Dyagram senaryo|Dyagram Senaryo|Egzanp|Ejemplos|Eksempler|Ekzemploj|Enghreifftiau|Esbozo do escenario|Escenari|Escenario|Esempi|Esquema de l'escenari|Esquema del escenario|Esquema do Cenario|Esquema do CenĂĄrio|Examples|EXAMPLZ|Exempel|Exemple|Exemples|Exemplos|First off|Fono|ForgatĂłkĂśnyv|ForgatĂłkĂśnyv vĂĄzlat|Fundo|GeĂ§miĹ|ghantoH|Grundlage|Hannergrond|HĂĄttĂŠr|Heave to|Istorik|Juhtumid|Keadaan|Khung káťch báşŁn|Khung tĂŹnh huáťng|Káťch báşŁn|Koncept|Konsep skenario|KontĂ¨ks|Kontekst|Kontekstas|Konteksts|Kontext|Konturo de la scenaro|Latar Belakang|lut|lut chovnatlh|lutmey|LĂ˝sing AtburĂ°arĂĄsar|LĂ˝sing DĂŚma|Menggariskan Senario|MISHUN|MISHUN SRSLY|mo'|NĂĄÄrt ScenĂĄra|NĂĄÄrt ScĂŠnĂĄĹe|NĂĄÄrt ScenĂĄru|Oris scenarija|Ărnekler|Osnova|Osnova ScenĂĄra|Osnova scĂŠnĂĄĹe|Osnutek|Ozadje|Paraugs|PavyzdĹžiai|PĂŠldĂĄk|PiemÄri|Plan du scĂŠnario|Plan du ScĂŠnario|Plan senaryo|Plan Senaryo|Plang vum Szenario|PozadĂ­|Pozadie|Pozadina|PrĂ­klady|PĹĂ­klady|Primer|Primeri|Primjeri|PrzykĹady|Raamstsenaarium|Reckon it's like|Rerefons|ScenĂĄr|ScĂŠnĂĄĹ|Scenarie|Scenarij|Scenarijai|Scenarijaus ĹĄablonas|Scenariji|ScenÄrijs|ScenÄrijs pÄc parauga|Scenarijus|Scenario|ScĂŠnario|Scenario Amlinellol|Scenario Outline|Scenario Template|Scenariomal|Scenariomall|Scenarios|Scenariu|Scenariusz|Scenaro|Schema dello scenario|Se Ă°e|Se the|Se Ăže|Senario|Senaryo|Senaryo deskripsyon|Senaryo Deskripsyon|Senaryo taslaÄÄą|Shiver me timbers|SituÄcija|Situai|Situasie|Situasie Uiteensetting|Skenario|Skenario konsep|Skica|Structura scenariu|StructurÄ scenariu|Struktura scenarija|Stsenaarium|Swa|Swa hwaer swa|Swa hwĂŚr swa|Szablon scenariusza|Szenario|Szenariogrundriss|Tapaukset|Tapaus|Tapausaihio|Taust|Tausta|Template Keadaan|Template Senario|Template Situai|The thing of it is|TĂŹnh huáťng|Variantai|Voorbeelde|Voorbeelden|Wharrimean is|Yo\-ho\-ho|You'll wanna|ZaĹoĹźenia|Î ÎąĎÎąÎ´ÎľÎŻÎłÎźÎąĎÎą|Î ÎľĎÎšÎłĎÎąĎÎŽ ÎŁÎľÎ˝ÎąĎÎŻÎżĎ|ÎŁÎľÎ˝ÎŹĎÎšÎą|ÎŁÎľÎ˝ÎŹĎÎšÎż|ÎĽĎĎÎ˛ÎąÎ¸ĎÎż|ĐĐľŃĐľŃ|ĐĐžĐ˝ŃĐľĐşŃŃ|ĐĐžĐ˝ŃĐľĐżŃ|ĐĐ¸ŃĐ°ĐťĐťĐ°Ń|ĐĐ¸ŃĐžĐťĐťĐ°Ń|ĐŃĐ˝ĐžĐ˛Đ°|ĐĐľŃĐľĐ´ŃĐźĐžĐ˛Đ°|ĐĐžĐˇĐ°Đ´Đ¸Đ˝Đ°|ĐŃĐľĐ´Đ¸ŃŃĐžŃĐ¸Ń|ĐŃĐľĐ´ŃŃŃĐžŃĐ¸Ń|ĐŃĐ¸ĐşĐťĐ°Đ´Đ¸|ĐŃĐ¸ĐźĐľŃ|ĐŃĐ¸ĐźĐľŃĐ¸|ĐŃĐ¸ĐźĐľŃŃ|Đ Đ°ĐźĐşĐ° Đ˝Đ° ŃŃĐľĐ˝Đ°ŃĐ¸Đš|ĐĄĐşĐ¸ŃĐ°|ĐĄŃŃŃĐşŃŃŃĐ° ŃŃĐľĐ˝Đ°ŃĐ¸ŃĐ°|ĐĄŃŃŃĐşŃŃŃĐ° ŃŃĐľĐ˝Đ°ŃĐ¸Ń|ĐĄŃŃŃĐşŃŃŃĐ° ŃŃĐľĐ˝Đ°ŃŃŃ|ĐĄŃĐľĐ˝Đ°ŃĐ¸Đš|ĐĄŃĐľĐ˝Đ°ŃĐ¸Đš ŃŃŃŃĐşŃŃŃĐ°ŃĐ¸|ĐĄŃĐľĐ˝Đ°ŃĐ¸ĐšĐ˝ŃŇŁ ŃÓŠĐˇĐľĐťĐľŃĐľ|ĐĄŃĐľĐ˝Đ°ŃĐ¸ŃĐ¸|ĐĄŃĐľĐ˝Đ°ŃĐ¸Đž|ĐĄŃĐľĐ˝Đ°ŃŃĐš|Đ˘Đ°ŃĐ¸Ń|ŇŽŃĐ˝ÓĐşĐťÓŃ|×××××××Ş|×¨×§×˘|×Ş×× ××Ş ×Ş×¨×××Š|×Ş×¨×××Š|Ř§ŮŘŽŮŮŮŘŠ|Ř§ŮÚŻŮŰ ŘłŮŘ§ŘąŰŮ|Ř§ŮŘŤŮŘŠ|ŮžŘł ŮŮŘ¸Řą|Ř˛ŮŰŮŮ|ŘłŮŘ§ŘąŰŮ|ŘłŮŮŘ§ŘąŮŮ|ŘłŮŮŘ§ŘąŮŮ ŮŘŽŘˇŘˇ|ŮŘŤŘ§ŮŰÚş|ŮŮŘ¸Řą ŮŘ§ŮŰ ÚŠŘ§ ŘŽŘ§ÚŠŰ|ŮŮŘ¸ŘąŮŘ§ŮŰ|ŮŮŮŮŮ ŮŘ§|ŕ¤ŕ¤Śŕ¤žŕ¤šŕ¤°ŕ¤Ł|ŕ¤Şŕ¤°ŕ¤żŕ¤ŚŕĽŕ¤śŕĽŕ¤Ż|ŕ¤Şŕ¤°ŕ¤żŕ¤ŚŕĽŕ¤śŕĽŕ¤Ż ŕ¤°ŕĽŕ¤Şŕ¤°ŕĽŕ¤ŕ¤ž|ŕ¤ŞŕĽŕ¤ˇŕĽŕ¤ ŕ¤­ŕĽŕ¤Žŕ¤ż|ŕ¨ŕ¨Śŕ¨žŕ¨šŕ¨°ŕ¨¨ŕ¨žŕ¨|ŕ¨Şŕ¨ŕ¨ŕ¨Ľŕ¨ž|ŕ¨Şŕ¨ŕ¨ŕ¨Ľŕ¨ž ŕ¨˘ŕ¨žŕ¨ŕ¨ŕ¨ž|ŕ¨Şŕ¨ŕ¨ŕ¨Ľŕ¨ž ŕ¨°ŕŠŕ¨Ş ŕ¨°ŕŠŕ¨ŕ¨ž|ŕ¨Şŕ¨żŕ¨ŕŠŕ¨ŕŠ|ŕ°ŕ°Śŕ°žŕ°šŕ°°ŕ°Łŕ°˛ŕą|ŕ°ŕ°Ľŕ°¨ŕ°|ŕ°¨ŕąŕ°Şŕ°Ľŕąŕ°Żŕ°|ŕ°¸ŕ°¨ŕąŕ°¨ŕ°żŕ°ľŕąŕ°śŕ°|ŕ˛ŕ˛Śŕ˛žŕ˛šŕ˛°ŕ˛Łŕłŕ˛ŕ˛łŕł|ŕ˛ŕ˛Ľŕ˛žŕ˛¸ŕ˛žŕ˛°ŕ˛žŕ˛ŕ˛ś|ŕ˛ľŕ˛żŕ˛ľŕ˛°ŕ˛Łŕł|ŕ˛šŕ˛żŕ˛¨ŕłŕ˛¨ŕłŕ˛˛ŕł|ŕšŕ¸ŕ¸Łŕ¸ŕ¸Şŕ¸Łŕšŕ¸˛ŕ¸ŕ¸ŕ¸­ŕ¸ŕšŕ¸Ťŕ¸ŕ¸¸ŕ¸ŕ¸˛ŕ¸Łŕ¸ŕš|ŕ¸ŕ¸¸ŕ¸ŕ¸ŕ¸­ŕ¸ŕ¸ŕ¸ąŕ¸§ŕ¸­ŕ¸˘ŕšŕ¸˛ŕ¸|ŕ¸ŕ¸¸ŕ¸ŕ¸ŕ¸­ŕ¸ŕšŕ¸Ťŕ¸ŕ¸¸ŕ¸ŕ¸˛ŕ¸Łŕ¸ŕš|ŕšŕ¸ŕ¸§ŕ¸ŕ¸´ŕ¸|ŕ¸Şŕ¸Łŕ¸¸ŕ¸ŕšŕ¸Ťŕ¸ŕ¸¸ŕ¸ŕ¸˛ŕ¸Łŕ¸ŕš|ŕšŕ¸Ťŕ¸ŕ¸¸ŕ¸ŕ¸˛ŕ¸Łŕ¸ŕš|ë°°ę˛˝|ěëëŚŹě¤|ěëëŚŹě¤ ę°ě|ě|ăľăłăăŤ|ăˇăăŞăŞ|ăˇăăŞăŞă˘ăŚăăŠă¤ăł|ăˇăăŞăŞăăłăăŹ|ăˇăăŞăŞăăłăăŹăźă|ăăłăăŹ|äž|äžĺ­|ĺ§ćŹ|ĺ§ćŹĺ¤§çş˛|ĺćŹ|ĺćŹĺ¤§çśą|ĺşćŻ|ĺşćŻĺ¤§çş˛|ĺ ´ćŻ|ĺ ´ćŻĺ¤§çśą|čćŻ):[^:\r\n]*/,
        lookbehind: true,
        inside: {
            'important': {
                pattern: /(:)[^\r\n]*/,
                lookbehind: true
            },
            keyword: /[^:\r\n]+:/
        }
    },
    'table-body': {
        pattern: /((?:\r?\n|\r)[ \t]*\|.+\|[^\r\n]*)+/,
        lookbehind: true,
        inside: {
            'outline': {
                pattern: /<[^>]+?>/,
                alias: 'variable'
            },
            'td': {
                pattern: /\s*[^\s|][^|]*/,
                alias: 'string'
            },
            'punctuation': /\|/
        }
    },
    'table-head': {
        pattern: /((?:\r?\n|\r)[ \t]*\|.+\|[^\r\n]*)/,
        inside: {
            'th': {
                pattern: /\s*[^\s|][^|]*/,
                alias: 'variable'
            },
            'punctuation': /\|/
        }
    },
    'atrule': {
        pattern: /((?:\r?\n|\r)[ \t]+)('ach|'a|'ej|7|a|A takĂŠ|A taktieĹž|A tieĹž|A zĂĄroveĹ|Aber|Ac|Adott|Akkor|Ak|Aleshores|Ale|Ali|Allora|Alors|Als|Ama|Amennyiben|Amikor|Ampak|an|AN|Ananging|And y'all|And|Angenommen|Anrhegedig a|An|Apabila|AtĂ¨s|Atesa|Atunci|Avast!|Aye|A|awer|Bagi|Banjur|Bet|Biáşżt|Blimey!|Buh|But at the end of the day I reckon|But y'all|But|BUT|Cal|CĂ˘nd|Cando|Cand|Ce|Cuando|Äe|Ăa Ă°e|Ăa|Dadas|Dada|Dados|Dado|DaH ghu' bejlu'|dann|Dann|Dano|Dan|Dar|Dat fiind|Data|Date fiind|Date|Dati fiind|Dati|DaĹŁi fiind|DaČi fiind|Dato|DEN|Den youse gotta|Dengan|De|Diberi|Diyelim ki|Donada|Donat|DonitaÄľo|Do|Dun|Duota|Ăurh|Eeldades|Ef|EÄer ki|Entao|EntĂŁo|EntĂłn|Entonces|En|Epi|E|Ăs|Etant donnĂŠe|Etant donnĂŠ|Et|Ătant donnĂŠes|Ătant donnĂŠe|Ătant donnĂŠ|Etant donnĂŠes|Etant donnĂŠs|Ătant donnĂŠs|Fakat|Gangway!|Gdy|Gegeben seien|Gegeben sei|Gegeven|Gegewe|ghu' noblu'|Gitt|Given y'all|Given|Givet|Givun|Ha|Cho|I CAN HAZ|In|Ir|It's just unbelievable|I|Ja|JeĹli|JeĹźeli|Kadar|Kada|Kad|Kai|Kaj|KdyĹž|KeÄ|Kemudian|Ketika|Khi|Kiedy|Ko|Kuid|Kui|Kun|Lan|latlh|Le sa a|Let go and haul|Le|LĂ¨ sa a|LĂ¨|Logo|Lorsqu'<|Lorsque|mĂ¤|Maar|Mais|MajÄc|Majd|Maka|Manawa|Mas|Ma|Menawa|Men|Mutta|Nalikaning|Nalika|Nanging|NĂĽr|NĂ¤r|Nato|NhĆ°ng|Niin|Njuk|O zaman|Og|Och|Oletetaan|Onda|Ond|Oraz|Pak|Pero|PerĂ˛|Podano|PokiaÄž|Pokud|Potem|Potom|Privzeto|Pryd|qaSDI'|Quando|Quand|Quan|SĂĽ|Sed|Se|Siis|Sipoze ke|Sipoze Ke|Sipoze|Si|Ĺi|Či|Soit|Stel|Tada|Tad|Takrat|Tak|Tapi|Ter|Tetapi|Tha the|Tha|Then y'all|Then|ThĂŹ|Thurh|Toda|Too right|ugeholl|Und|Un|VĂ |vaj|Vendar|Ve|wann|Wanneer|WEN|Wenn|When y'all|When|Wtedy|Wun|Y'know|Yeah nah|Yna|Youse know like when|Youse know when youse got|Y|Za predpokladu|Za pĹedpokladu|Zadani|Zadano|Zadan|Zadate|Zadato|ZakĹadajÄc|Zaradi|Zatati|Ăa Ăže|Ăa|ĂĂĄ|Ăegar|Ăurh|ÎÎťÎťÎŹ|ÎÎľÎ´ÎżÎźÎ­Î˝ÎżĎ|ÎÎąÎš|ÎĎÎąÎ˝|Î¤ĎĎÎľ|Đ ŃĐ°ĐşĐžĐś|ĐĐłĐ°Ń|ĐĐťĐľ|ĐĐťĐ¸|ĐĐźĐźĐž|Đ|ÓĐłÓŃ|ÓĐšŃĐ¸Đş|ÓĐźĐźĐ°|ĐĐ¸ŃĐžĐş|ĐĐ°|ĐÓ|ĐĐ°Đ´ĐľĐ˝Đž|ĐĐ°Đ˝Đž|ĐĐžĐżŃŃŃĐ¸Đź|ĐŃĐťĐ¸|ĐĐ°Đ´Đ°ŃĐľ|ĐĐ°Đ´Đ°ŃĐ¸|ĐĐ°Đ´Đ°ŃĐž|Đ|Đ|Đ ŃĐžĐźŃ ĐśĐľ|ĐĐ°Đ´Đ°|ĐĐ°Đ´|ĐĐžĐłĐ°ŃĐž|ĐĐžĐłĐ´Đ°|ĐĐžĐťĐ¸|ĐÓĐşĐ¸Đ˝|ĐĐľĐşĐ¸Đ˝|ĐÓŃĐ¸ŇÓĐ´Ó|ĐĐľŃĐ°Đš|ĐĐž|ĐĐ˝Đ´Đ°|ĐŃĐ¸ĐżŃŃŃĐ¸ĐźĐž, ŃĐž|ĐŃĐ¸ĐżŃŃŃĐ¸ĐźĐž|ĐŃŃŃŃ|Đ˘Đ°ĐşĐśĐľ|Đ˘Đ°|Đ˘ĐžĐłĐ´Đ°|Đ˘ĐžĐ´Ń|Đ˘Đž|ĐŁĐ˝Đ´Đ°|ŇşÓĐź|ĐŻĐşŃĐž|×××|×××|××|×××× ×Ş×|×××|×××Š×¨|Ř˘ŮÚŻŘ§Ů|Ř§Ř°Ř§Ů|Ř§ÚŻŘą|Ř§ŮŘ§|Ř§ŮŘą|Ř¨Ř§ ŮŘąŘś|Ř¨Ř§ŮŮŘąŘś|Ř¨ŮŘąŘś|ŮžÚžŘą|ŘŞŘ¨|ŘŤŮ|ŘŹŘ¨|ŘšŮŘŻŮŘ§|ŮŘąŘś ÚŠŰŘ§|ŮŮŮ|ŮŰÚŠŮ|ŮŘŞŮ|ŮŮÚŻŘ§ŮŰ|Ů|ŕ¤ŕ¤ŕ¤°|ŕ¤ŕ¤°|ŕ¤ŕ¤Śŕ¤ž|ŕ¤ŕ¤żŕ¤¨ŕĽŕ¤¤ŕĽ|ŕ¤ŕĽŕ¤ŕ¤ŕ¤ż|ŕ¤ŕ¤Ź|ŕ¤¤ŕ¤Ľŕ¤ž|ŕ¤¤ŕ¤Śŕ¤ž|ŕ¤¤ŕ¤Ź|ŕ¤Şŕ¤°ŕ¤¨ŕĽŕ¤¤ŕĽ|ŕ¤Şŕ¤°|ŕ¤Żŕ¤Śŕ¤ż|ŕ¨ŕ¨¤ŕŠ|ŕ¨ŕ¨ŚŕŠŕ¨|ŕ¨ŕ¨żŕ¨ľŕŠŕ¨ ŕ¨ŕ¨ż|ŕ¨ŕŠŕ¨ŕ¨°|ŕ¨¤ŕ¨Ś|ŕ¨Şŕ¨°|ŕ°ŕ°Şŕąŕ°Şŕąŕ°Ąŕą|ŕ° ŕ°Şŕ°°ŕ°żŕ°¸ŕąŕ°Ľŕ°żŕ°¤ŕ°żŕ°˛ŕą|ŕ°ŕ°žŕ°¨ŕ°ż|ŕ°ŕąŕ°Şŕąŕ°Şŕ°Źŕ°Ąŕ°żŕ°¨ŕ°Śŕ°ż|ŕ°Žŕ°°ŕ°żŕ°Żŕą|ŕ˛ŕ˛Śŕ˛°ŕł|ŕ˛¨ŕ˛ŕ˛¤ŕ˛°|ŕ˛¨ŕ˛żŕłŕ˛Ąŕ˛żŕ˛Ś|ŕ˛Žŕ˛¤ŕłŕ˛¤ŕł|ŕ˛¸ŕłŕ˛Ľŕ˛żŕ˛¤ŕ˛żŕ˛Żŕ˛¨ŕłŕ˛¨ŕł|ŕ¸ŕ¸łŕ¸Ťŕ¸ŕ¸ŕšŕ¸Ťŕš|ŕ¸ŕ¸ąŕ¸ŕ¸ŕ¸ąŕšŕ¸|ŕšŕ¸ŕš|ŕšŕ¸Ąŕ¸ˇŕšŕ¸­|ŕšŕ¸Ľŕ¸°|ęˇ¸ëŹëŠ´<|ęˇ¸ëŚŹęł <|ë¨<|ë§ě˝<|ë§ěź<|ë¨źě <|ěĄ°ęą´<|íě§ë§<|ăă¤<|ăăă<|ăă ă<|ăŞăă°<|ăă<|ä¸Śä¸<|ä˝ă<|ä˝ćŻ<|ĺĺŚ<|ĺĺŽ<|ĺč¨­<|ĺčŽž<|ĺć<|ĺćś<|ĺć<|ĺšśä¸<|ĺ˝<|çś<|čä¸<|éŁäš<|éŁéşź<)(?=[ \t]+)/,
        lookbehind: true
    },
    'string': {
        pattern: /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/,
        inside: {
            'outline': {
                pattern: /<[^>]+?>/,
                alias: 'variable'
            }
        }
    },
    'outline': {
        pattern: /<[^>]+?>/,
        alias: 'variable'
    }
};

Prism.languages.git = {
    /*
     * A simple one line comment like in a git status command
     * For instance:
     * $ git status
     * # On branch infinite-scroll
     * # Your branch and 'origin/sharedBranches/frontendTeam/infinite-scroll' have diverged,
     * # and have 1 and 2 different commits each, respectively.
     * nothing to commit (working directory clean)
     */
    'comment': /^#.*/m,

    /*
     * Regexp to match the changed lines in a git diff output. Check the example below.
     */
    'deleted': /^[-â].*/m,
    'inserted': /^\+.*/m,

    /*
     * a string (double and simple quote)
     */
    'string': /("|')(\\?.)*?\1/m,

    /*
     * a git command. It starts with a random prompt finishing by a $, then "git" then some other parameters
     * For instance:
     * $ git add file.txt
     */
    'command': {
        pattern: /^.*\$ git .*$/m,
        inside: {
            /*
             * A git command can contain a parameter starting by a single or a double dash followed by a string
             * For instance:
             * $ git diff --cached
             * $ git log -p
             */
            'parameter': /\s(--|-)\w+/m
        }
    },

    /*
     * Coordinates displayed in a git diff command
     * For instance:
     * $ git diff
     * diff --git file.txt file.txt
     * index 6214953..1d54a52 100644
     * --- file.txt
     * +++ file.txt
     * @@ -1 +1,2 @@
     * -Here's my tetx file
     * +Here's my text file
     * +And this is the second line
     */
    'coord': /^@@.*@@$/m,

    /*
     * Match a "commit [SHA1]" line in a git log output.
     * For instance:
     * $ git log
     * commit a11a14ef7e26f2ca62d4b35eac455ce636d0dc09
     * Author: lgiraudel
     * Date:   Mon Feb 17 11:18:34 2014 +0100
     *
     *     Add of a new line
     */
    'commit_sha1': /^commit \w{40}$/m
};

Prism.languages.go = Prism.languages.extend('clike', {
    'keyword': /\b(break|case|chan|const|continue|default|defer|else|fallthrough|for|func|go(to)?|if|import|interface|map|package|range|return|select|struct|switch|type|var)\b/,
    'builtin': /\b(bool|byte|complex(64|128)|error|float(32|64)|rune|string|u?int(8|16|32|64|)|uintptr|append|cap|close|complex|copy|delete|imag|len|make|new|panic|print(ln)?|real|recover)\b/,
    'boolean': /\b(_|iota|nil|true|false)\b/,
    'operator': /[*\/%^!=]=?|\+[=+]?|-[=-]?|\|[=|]?|&(?:=|&|\^=?)?|>(?:>=?|=)?|<(?:<=?|=|-)?|:=|\.\.\./,
    'number': /\b(-?(0x[a-f\d]+|(\d+\.?\d*|\.\d+)(e[-+]?\d+)?)i?)\b/i,
    'string': /("|'|`)(\\?.|\r|\n)*?\1/
});
delete Prism.languages.go['class-name'];

(function(Prism) {

    var handlebars_pattern = /\{\{\{[\w\W]+?\}\}\}|\{\{[\w\W]+?\}\}/g;

    Prism.languages.handlebars = Prism.languages.extend('markup', {
        'handlebars': {
            pattern: handlebars_pattern,
            inside: {
                'delimiter': {
                    pattern: /^\{\{\{?|\}\}\}?$/i,
                    alias: 'punctuation'
                },
                'string': /(["'])(\\?.)*?\1/,
                'number': /\b-?(0x[\dA-Fa-f]+|\d*\.?\d+([Ee][+-]?\d+)?)\b/,
                'boolean': /\b(true|false)\b/,
                'block': {
                    pattern: /^(\s*~?\s*)[#\/]\S+?(?=\s*~?\s*$|\s)/i,
                    lookbehind: true,
                    alias: 'keyword'
                },
                'brackets': {
                    pattern: /\[[^\]]+\]/,
                    inside: {
                        punctuation: /\[|\]/,
                        variable: /[\w\W]+/
                    }
                },
                'punctuation': /[!"#%&'()*+,.\/;<=>@\[\\\]^`{|}~]/,
                'variable': /[^!"#%&'()*+,.\/;<=>@\[\\\]^`{|}~\s]+/
            }
        }
    });

    // Comments are inserted at top so that they can
    // surround markup
    Prism.languages.insertBefore('handlebars', 'tag', {
        'handlebars-comment': {
            pattern: /\{\{![\w\W]*?\}\}/,
            alias: ['handlebars','comment']
        }
    });

    // Tokenize all inline Handlebars expressions that are wrapped in {{ }} or {{{ }}}
    // This allows for easy Handlebars + markup highlighting
    Prism.hooks.add('before-highlight', function(env) {
        if (env.language !== 'handlebars') {
            return;
        }

        env.tokenStack = [];

        env.backupCode = env.code;
        env.code = env.code.replace(handlebars_pattern, function(match) {
            env.tokenStack.push(match);

            return '___HANDLEBARS' + env.tokenStack.length + '___';
        });
    });

    // Restore env.code for other plugins (e.g. line-numbers)
    Prism.hooks.add('before-insert', function(env) {
        if (env.language === 'handlebars') {
            env.code = env.backupCode;
            delete env.backupCode;
        }
    });

    // Re-insert the tokens after highlighting
    // and highlight them with defined grammar
    Prism.hooks.add('after-highlight', function(env) {
        if (env.language !== 'handlebars') {
            return;
        }

        for (var i = 0, t; t = env.tokenStack[i]; i++) {
            // The replace prevents $$, $&, $`, $', $n, $nn from being interpreted as special patterns
            env.highlightedCode = env.highlightedCode.replace('___HANDLEBARS' + (i + 1) + '___', Prism.highlight(t, env.grammar, 'handlebars').replace(/\$/g, '$$$$'));
        }

        env.element.innerHTML = env.highlightedCode;
    });

}(Prism));

Prism.languages.http = {
    'request-line': {
        pattern: /^(POST|GET|PUT|DELETE|OPTIONS|PATCH|TRACE|CONNECT)\b\shttps?:\/\/\S+\sHTTP\/[0-9.]+/m,
        inside: {
            // HTTP Verb
            property: /^(POST|GET|PUT|DELETE|OPTIONS|PATCH|TRACE|CONNECT)\b/,
            // Path or query argument
            'attr-name': /:\w+/
        }
    },
    'response-status': {
        pattern: /^HTTP\/1.[01] [0-9]+.*/m,
        inside: {
            // Status, e.g. 200 OK
            property: {
                pattern: /(^HTTP\/1.[01] )[0-9]+.*/i,
                lookbehind: true
            }
        }
    },
    // HTTP header name
    'header-name': {
        pattern: /^[\w-]+:(?=.)/m,
        alias: 'keyword'
    }
};

// Create a mapping of Content-Type headers to language definitions
var httpLanguages = {
    'application/json': Prism.languages.javascript,
    'application/xml': Prism.languages.markup,
    'text/xml': Prism.languages.markup,
    'text/html': Prism.languages.markup
};

// Insert each content type parser that has its associated language
// currently loaded.
for (var contentType in httpLanguages) {
    if (httpLanguages[contentType]) {
        var options = {};
        options[contentType] = {
            pattern: new RegExp('(content-type:\\s*' + contentType + '[\\w\\W]*?)(?:\\r?\\n|\\r){2}[\\w\\W]*', 'i'),
            lookbehind: true,
            inside: {
                rest: httpLanguages[contentType]
            }
        };
        Prism.languages.insertBefore('http', 'header-name', options);
    }
}
;
(function(Prism) {
    // TODO:
    // - Add CSS highlighting inside <style> tags
    // - Add support for multi-line code blocks
    // - Add support for interpolation #{} and !{}
    // - Add support for tag interpolation #[]
    // - Add explicit support for plain text using |
    // - Add support for markup embedded in plain text

    Prism.languages.jade = {

        // Multiline stuff should appear before the rest

        // This handles both single-line and multi-line comments
        'comment': {
            pattern: /(^([\t ]*))\/\/.*((?:\r?\n|\r)\2[\t ]+.+)*/m,
            lookbehind: true
        },

        // All the tag-related part is in lookbehind
        // so that it can be highlighted by the "tag" pattern
        'multiline-script': {
            pattern: /(^([\t ]*)script\b.*\.[\t ]*)((?:\r?\n|\r(?!\n))(?:\2[\t ]+.+|\s*?(?=\r?\n|\r)))+/m,
            lookbehind: true,
            inside: {
                rest: Prism.languages.javascript
            }
        },

        // See at the end of the file for known filters
        'filter': {
            pattern: /(^([\t ]*)):.+((?:\r?\n|\r(?!\n))(?:\2[\t ]+.+|\s*?(?=\r?\n|\r)))+/m,
            lookbehind: true,
            inside: {
                'filter-name': {
                    pattern: /^:[\w-]+/,
                    alias: 'variable'
                }
            }
        },

        'multiline-plain-text': {
            pattern: /(^([\t ]*)[\w\-#.]+\.[\t ]*)((?:\r?\n|\r(?!\n))(?:\2[\t ]+.+|\s*?(?=\r?\n|\r)))+/m,
            lookbehind: true
        },
        'markup': {
            pattern: /(^[\t ]*)<.+/m,
            lookbehind: true,
            inside: {
                rest: Prism.languages.markup
            }
        },
        'doctype': {
            pattern: /((?:^|\n)[\t ]*)doctype(?: .+)?/,
            lookbehind: true
        },

        // This handle all conditional and loop keywords
        'flow-control': {
            pattern: /(^[\t ]*)(?:if|unless|else|case|when|default|each|while)\b(?: .+)?/m,
            lookbehind: true,
            inside: {
                'each': {
                    pattern: /^each .+? in\b/,
                    inside: {
                        'keyword': /\b(?:each|in)\b/,
                        'punctuation': /,/
                    }
                },
                'branch': {
                    pattern: /^(?:if|unless|else|case|when|default|while)\b/,
                    alias: 'keyword'
                },
                rest: Prism.languages.javascript
            }
        },
        'keyword': {
            pattern: /(^[\t ]*)(?:block|extends|include|append|prepend)\b.+/m,
            lookbehind: true
        },
        'mixin': [
            // Declaration
            {
                pattern: /(^[\t ]*)mixin .+/m,
                lookbehind: true,
                inside: {
                    'keyword': /^mixin/,
                    'function': /\w+(?=\s*\(|\s*$)/,
                    'punctuation': /[(),.]/
                }
            },
            // Usage
            {
                pattern: /(^[\t ]*)\+.+/m,
                lookbehind: true,
                inside: {
                    'name': {
                        pattern: /^\+\w+/,
                        alias: 'function'
                    },
                    'rest': Prism.languages.javascript
                }
            }
        ],
        'script': {
            pattern: /(^[\t ]*script(?:(?:&[^(]+)?\([^)]+\))*[\t ]+).+/m,
            lookbehind: true,
            inside: {
                rest: Prism.languages.javascript
            }
        },

        'plain-text': {
            pattern: /(^[\t ]*(?!-)[\w\-#.]*[\w\-](?:(?:&[^(]+)?\([^)]+\))*\/?[\t ]+).+/m,
            lookbehind: true
        },
        'tag': {
            pattern: /(^[\t ]*)(?!-)[\w\-#.]*[\w\-](?:(?:&[^(]+)?\([^)]+\))*\/?:?/m,
            lookbehind: true,
            inside: {
                'attributes': [
                    {
                        pattern: /&[^(]+\([^)]+\)/,
                        inside: {
                            rest: Prism.languages.javascript
                        }
                    },
                    {
                        pattern: /\([^)]+\)/,
                        inside: {
                            'attr-value': {
                                pattern: /(=\s*)(?:\{[^}]*\}|[^,)\r\n]+)/,
                                lookbehind: true,
                                inside: {
                                    rest: Prism.languages.javascript
                                }
                            },
                            'attr-name': /[\w-]+(?=\s*!?=|\s*[,)])/,
                            'punctuation': /[!=(),]+/
                        }
                    }
                ],
                'punctuation': /:/
            }
        },
        'code': [
            {
                pattern: /(^[\t ]*(?:-|!?=)).+/m,
                lookbehind: true,
                inside: {
                    rest: Prism.languages.javascript
                }
            }
        ],
        'punctuation': /[.\-!=|]+/
    };

    var filter_pattern = '(^([\\t ]*)):{{filter_name}}((?:\\r?\\n|\\r(?!\\n))(?:\\2[\\t ]+.+|\\s*?(?=\\r?\\n|\\r)))+';

    // Non exhaustive list of available filters and associated languages
    var filters = [
        {filter:'atpl',language:'twig'},
        {filter:'coffee',language:'coffeescript'},
        'ejs',
        'handlebars',
        'hogan',
        'less',
        'livescript',
        'markdown',
        'mustache',
        'plates',
        {filter:'sass',language:'scss'},
        'stylus',
        'swig'

    ];
    var all_filters = {};
    for (var i = 0, l = filters.length; i < l; i++) {
        var filter = filters[i];
        filter = typeof filter === 'string' ? {filter: filter, language: filter} : filter;
        if (Prism.languages[filter.language]) {
            all_filters['filter-' + filter.filter] = {
                pattern: RegExp(filter_pattern.replace('{{filter_name}}', filter.filter), 'm'),
                lookbehind: true,
                inside: {
                    'filter-name': {
                        pattern: /^:[\w-]+/,
                        alias: 'variable'
                    },
                    rest: Prism.languages[filter.language]
                }
            }
        }
    }

    Prism.languages.insertBefore('jade', 'filter', all_filters);

}(Prism));
Prism.languages.java = Prism.languages.extend('clike', {
    'keyword': /\b(abstract|continue|for|new|switch|assert|default|goto|package|synchronized|boolean|do|if|private|this|break|double|implements|protected|throw|byte|else|import|public|throws|case|enum|instanceof|return|transient|catch|extends|int|short|try|char|final|interface|static|void|class|finally|long|strictfp|volatile|const|float|native|super|while)\b/,
    'number': /\b0b[01]+\b|\b0x[\da-f]*\.?[\da-fp\-]+\b|\b\d*\.?\d+(?:e[+-]?\d+)?[df]?\b/i,
    'operator': {
        pattern: /(^|[^.])(?:\+[+=]?|-[-=]?|!=?|<<?=?|>>?>?=?|==?|&[&=]?|\|[|=]?|\*=?|\/=?|%=?|\^=?|[?:~])/m,
        lookbehind: true
    }
});
Prism.languages.json = {
    'property': /".*?"(?=\s*:)/ig,
    'string': /"(?!:)(\\?[^"])*?"(?!:)/g,
    'number': /\b-?(0x[\dA-Fa-f]+|\d*\.?\d+([Ee]-?\d+)?)\b/g,
    'punctuation': /[{}[\]);,]/g,
    'operator': /:/g,
    'boolean': /\b(true|false)\b/gi,
    'null': /\bnull\b/gi,
};

Prism.languages.jsonp = Prism.languages.json;

/* FIXME :
 :extend() is not handled specifically : its highlighting is buggy.
 Mixin usage must be inside a ruleset to be highlighted.
 At-rules (e.g. import) containing interpolations are buggy.
 Detached rulesets are highlighted as at-rules.
 A comment before a mixin usage prevents the latter to be properly highlighted.
 */

Prism.languages.less = Prism.languages.extend('css', {
    'comment': [
        /\/\*[\w\W]*?\*\//,
        {
            pattern: /(^|[^\\])\/\/.*/,
            lookbehind: true
        }
    ],
    'atrule': {
        pattern: /@[\w-]+?(?:\([^{}]+\)|[^(){};])*?(?=\s*\{)/i,
        inside: {
            'punctuation': /[:()]/
        }
    },
    // selectors and mixins are considered the same
    'selector': {
        pattern: /(?:@\{[\w-]+\}|[^{};\s@])(?:@\{[\w-]+\}|\([^{}]*\)|[^{};@])*?(?=\s*\{)/,
        inside: {
            // mixin parameters
            'variable': /@+[\w-]+/
        }
    },

    'property': /(?:@\{[\w-]+\}|[\w-])+(?:\+_?)?(?=\s*:)/i,
    'punctuation': /[{}();:,]/,
    'operator': /[+\-*\/]/
});

// Invert function and punctuation positions
Prism.languages.insertBefore('less', 'punctuation', {
    'function': Prism.languages.less.function
});

Prism.languages.insertBefore('less', 'property', {
    'variable': [
        // Variable declaration (the colon must be consumed!)
        {
            pattern: /@[\w-]+\s*:/,
            inside: {
                "punctuation": /:/
            }
        },

        // Variable usage
        /@@?[\w-]+/
    ],
    'mixin-usage': {
        pattern: /([{;]\s*)[.#](?!\d)[\w-]+.*?(?=[(;])/,
        lookbehind: true,
        alias: 'function'
    }
});

Prism.languages.makefile = {
    'comment': {
        pattern: /(^|[^\\])#(?:\\(?:\r\n|[\s\S])|.)*/,
        lookbehind: true
    },
    'string': /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,

    // Built-in target names
    'builtin': /\.[A-Z][^:#=\s]+(?=\s*:(?!=))/,

    // Targets
    'symbol': {
        pattern: /^[^:=\r\n]+(?=\s*:(?!=))/m,
        inside: {
            'variable': /\$+(?:[^(){}:#=\s]+|(?=[({]))/
        }
    },
    'variable': /\$+(?:[^(){}:#=\s]+|\([@*%<^+?][DF]\)|(?=[({]))/,

    'keyword': [
        // Directives
        /-include\b|\b(?:define|else|endef|endif|export|ifn?def|ifn?eq|include|override|private|sinclude|undefine|unexport|vpath)\b/,
        // Functions
        {
            pattern: /(\()(?:addsuffix|abspath|and|basename|call|dir|error|eval|file|filter(?:-out)?|findstring|firstword|flavor|foreach|guile|if|info|join|lastword|load|notdir|or|origin|patsubst|realpath|shell|sort|strip|subst|suffix|value|warning|wildcard|word(?:s|list)?)(?=[ \t])/,
            lookbehind: true
        }
    ],
    'operator': /(?:::|[?:+!])?=|[|@]/,
    'punctuation': /[:;(){}]/
};
Prism.languages.markdown = Prism.languages.extend('markup', {});
Prism.languages.insertBefore('markdown', 'prolog', {
    'blockquote': {
        // > ...
        pattern: /^>(?:[\t ]*>)*/m,
        alias: 'punctuation'
    },
    'code': [
        {
            // Prefixed by 4 spaces or 1 tab
            pattern: /^(?: {4}|\t).+/m,
            alias: 'keyword'
        },
        {
            // `code`
            // ``code``
            pattern: /``.+?``|`[^`\n]+`/,
            alias: 'keyword'
        }
    ],
    'title': [
        {
            // title 1
            // =======

            // title 2
            // -------
            pattern: /\w+.*(?:\r?\n|\r)(?:==+|--+)/,
            alias: 'important',
            inside: {
                punctuation: /==+$|--+$/
            }
        },
        {
            // # title 1
            // ###### title 6
            pattern: /(^\s*)#+.+/m,
            lookbehind: true,
            alias: 'important',
            inside: {
                punctuation: /^#+|#+$/
            }
        }
    ],
    'hr': {
        // ***
        // ---
        // * * *
        // -----------
        pattern: /(^\s*)([*-])([\t ]*\2){2,}(?=\s*$)/m,
        lookbehind: true,
        alias: 'punctuation'
    },
    'list': {
        // * item
        // + item
        // - item
        // 1. item
        pattern: /(^\s*)(?:[*+-]|\d+\.)(?=[\t ].)/m,
        lookbehind: true,
        alias: 'punctuation'
    },
    'url-reference': {
        // [id]: http://example.com "Optional title"
        // [id]: http://example.com 'Optional title'
        // [id]: http://example.com (Optional title)
        // [id]: <http://example.com> "Optional title"
        pattern: /!?\[[^\]]+\]:[\t ]+(?:\S+|<(?:\\.|[^>\\])+>)(?:[\t ]+(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\((?:\\.|[^)\\])*\)))?/,
        inside: {
            'variable': {
                pattern: /^(!?\[)[^\]]+/,
                lookbehind: true
            },
            'string': /(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\((?:\\.|[^)\\])*\))$/,
            'punctuation': /^[\[\]!:]|[<>]/
        },
        alias: 'url'
    },
    'bold': {
        // **strong**
        // __strong__

        // Allow only one line break
        pattern: /(^|[^\\])(\*\*|__)(?:(?:\r?\n|\r)(?!\r?\n|\r)|.)+?\2/,
        lookbehind: true,
        inside: {
            'punctuation': /^\*\*|^__|\*\*$|__$/
        }
    },
    'italic': {
        // *em*
        // _em_

        // Allow only one line break
        pattern: /(^|[^\\])([*_])(?:(?:\r?\n|\r)(?!\r?\n|\r)|.)+?\2/,
        lookbehind: true,
        inside: {
            'punctuation': /^[*_]|[*_]$/
        }
    },
    'url': {
        // [example](http://example.com "Optional title")
        // [example] [id]
        pattern: /!?\[[^\]]+\](?:\([^\s)]+(?:[\t ]+"(?:\\.|[^"\\])*")?\)| ?\[[^\]\n]*\])/,
        inside: {
            'variable': {
                pattern: /(!?\[)[^\]]+(?=\]$)/,
                lookbehind: true
            },
            'string': {
                pattern: /"(?:\\.|[^"\\])*"(?=\)$)/
            }
        }
    }
});

Prism.languages.markdown['bold'].inside['url'] = Prism.util.clone(Prism.languages.markdown['url']);
Prism.languages.markdown['italic'].inside['url'] = Prism.util.clone(Prism.languages.markdown['url']);
Prism.languages.markdown['bold'].inside['italic'] = Prism.util.clone(Prism.languages.markdown['italic']);
Prism.languages.markdown['italic'].inside['bold'] = Prism.util.clone(Prism.languages.markdown['bold']);
Prism.languages.nginx = Prism.languages.extend('clike', {
    'comment': {
        pattern: /(^|[^"{\\])#.*/,
        lookbehind: true
    },
    'keyword': /\b(?:CONTENT_|DOCUMENT_|GATEWAY_|HTTP_|HTTPS|if_not_empty|PATH_|QUERY_|REDIRECT_|REMOTE_|REQUEST_|SCGI|SCRIPT_|SERVER_|http|server|events|location|include|accept_mutex|accept_mutex_delay|access_log|add_after_body|add_before_body|add_header|addition_types|aio|alias|allow|ancient_browser|ancient_browser_value|auth|auth_basic|auth_basic_user_file|auth_http|auth_http_header|auth_http_timeout|autoindex|autoindex_exact_size|autoindex_localtime|break|charset|charset_map|charset_types|chunked_transfer_encoding|client_body_buffer_size|client_body_in_file_only|client_body_in_single_buffer|client_body_temp_path|client_body_timeout|client_header_buffer_size|client_header_timeout|client_max_body_size|connection_pool_size|create_full_put_path|daemon|dav_access|dav_methods|debug_connection|debug_points|default_type|deny|devpoll_changes|devpoll_events|directio|directio_alignment|disable_symlinks|empty_gif|env|epoll_events|error_log|error_page|expires|fastcgi_buffer_size|fastcgi_buffers|fastcgi_busy_buffers_size|fastcgi_cache|fastcgi_cache_bypass|fastcgi_cache_key|fastcgi_cache_lock|fastcgi_cache_lock_timeout|fastcgi_cache_methods|fastcgi_cache_min_uses|fastcgi_cache_path|fastcgi_cache_purge|fastcgi_cache_use_stale|fastcgi_cache_valid|fastcgi_connect_timeout|fastcgi_hide_header|fastcgi_ignore_client_abort|fastcgi_ignore_headers|fastcgi_index|fastcgi_intercept_errors|fastcgi_keep_conn|fastcgi_max_temp_file_size|fastcgi_next_upstream|fastcgi_no_cache|fastcgi_param|fastcgi_pass|fastcgi_pass_header|fastcgi_read_timeout|fastcgi_redirect_errors|fastcgi_send_timeout|fastcgi_split_path_info|fastcgi_store|fastcgi_store_access|fastcgi_temp_file_write_size|fastcgi_temp_path|flv|geo|geoip_city|geoip_country|google_perftools_profiles|gzip|gzip_buffers|gzip_comp_level|gzip_disable|gzip_http_version|gzip_min_length|gzip_proxied|gzip_static|gzip_types|gzip_vary|if|if_modified_since|ignore_invalid_headers|image_filter|image_filter_buffer|image_filter_jpeg_quality|image_filter_sharpen|image_filter_transparency|imap_capabilities|imap_client_buffer|include|index|internal|ip_hash|keepalive|keepalive_disable|keepalive_requests|keepalive_timeout|kqueue_changes|kqueue_events|large_client_header_buffers|limit_conn|limit_conn_log_level|limit_conn_zone|limit_except|limit_rate|limit_rate_after|limit_req|limit_req_log_level|limit_req_zone|limit_zone|lingering_close|lingering_time|lingering_timeout|listen|location|lock_file|log_format|log_format_combined|log_not_found|log_subrequest|map|map_hash_bucket_size|map_hash_max_size|master_process|max_ranges|memcached_buffer_size|memcached_connect_timeout|memcached_next_upstream|memcached_pass|memcached_read_timeout|memcached_send_timeout|merge_slashes|min_delete_depth|modern_browser|modern_browser_value|mp4|mp4_buffer_size|mp4_max_buffer_size|msie_padding|msie_refresh|multi_accept|open_file_cache|open_file_cache_errors|open_file_cache_min_uses|open_file_cache_valid|open_log_file_cache|optimize_server_names|override_charset|pcre_jit|perl|perl_modules|perl_require|perl_set|pid|pop3_auth|pop3_capabilities|port_in_redirect|post_action|postpone_output|protocol|proxy|proxy_buffer|proxy_buffer_size|proxy_buffering|proxy_buffers|proxy_busy_buffers_size|proxy_cache|proxy_cache_bypass|proxy_cache_key|proxy_cache_lock|proxy_cache_lock_timeout|proxy_cache_methods|proxy_cache_min_uses|proxy_cache_path|proxy_cache_use_stale|proxy_cache_valid|proxy_connect_timeout|proxy_cookie_domain|proxy_cookie_path|proxy_headers_hash_bucket_size|proxy_headers_hash_max_size|proxy_hide_header|proxy_http_version|proxy_ignore_client_abort|proxy_ignore_headers|proxy_intercept_errors|proxy_max_temp_file_size|proxy_method|proxy_next_upstream|proxy_no_cache|proxy_pass|proxy_pass_error_message|proxy_pass_header|proxy_pass_request_body|proxy_pass_request_headers|proxy_read_timeout|proxy_redirect|proxy_redirect_errors|proxy_send_lowat|proxy_send_timeout|proxy_set_body|proxy_set_header|proxy_ssl_session_reuse|proxy_store|proxy_store_access|proxy_temp_file_write_size|proxy_temp_path|proxy_timeout|proxy_upstream_fail_timeout|proxy_upstream_max_fails|random_index|read_ahead|real_ip_header|recursive_error_pages|request_pool_size|reset_timedout_connection|resolver|resolver_timeout|return|rewrite|root|rtsig_overflow_events|rtsig_overflow_test|rtsig_overflow_threshold|rtsig_signo|satisfy|satisfy_any|secure_link_secret|send_lowat|send_timeout|sendfile|sendfile_max_chunk|server|server_name|server_name_in_redirect|server_names_hash_bucket_size|server_names_hash_max_size|server_tokens|set|set_real_ip_from|smtp_auth|smtp_capabilities|so_keepalive|source_charset|split_clients|ssi|ssi_silent_errors|ssi_types|ssi_value_length|ssl|ssl_certificate|ssl_certificate_key|ssl_ciphers|ssl_client_certificate|ssl_crl|ssl_dhparam|ssl_engine|ssl_prefer_server_ciphers|ssl_protocols|ssl_session_cache|ssl_session_timeout|ssl_verify_client|ssl_verify_depth|starttls|stub_status|sub_filter|sub_filter_once|sub_filter_types|tcp_nodelay|tcp_nopush|timeout|timer_resolution|try_files|types|types_hash_bucket_size|types_hash_max_size|underscores_in_headers|uninitialized_variable_warn|upstream|use|user|userid|userid_domain|userid_expires|userid_name|userid_p3p|userid_path|userid_service|valid_referers|variables_hash_bucket_size|variables_hash_max_size|worker_connections|worker_cpu_affinity|worker_priority|worker_processes|worker_rlimit_core|worker_rlimit_nofile|worker_rlimit_sigpending|working_directory|xclient|xml_entities|xslt_entities|xslt_stylesheet|xslt_types)\b/i,
});

Prism.languages.insertBefore('nginx', 'keyword', {
    'variable': /\$[a-z_]+/i
});
/**
 * Original by Aaron Harun: http://aahacreative.com/2012/07/31/php-syntax-highlighting-prism/
 * Modified by Miles Johnson: http://milesj.me
 *
 * Supports the following:
 * 		- Extends clike syntax
 * 		- Support for PHP 5.3+ (namespaces, traits, generators, etc)
 * 		- Smarter constant and function matching
 *
 * Adds the following new token classes:
 * 		constant, delimiter, variable, function, package
 */

Prism.languages.php = Prism.languages.extend('clike', {
    'keyword': /\b(and|or|xor|array|as|break|case|cfunction|class|const|continue|declare|default|die|do|else|elseif|enddeclare|endfor|endforeach|endif|endswitch|endwhile|extends|for|foreach|function|include|include_once|global|if|new|return|static|switch|use|require|require_once|var|while|abstract|interface|public|implements|private|protected|parent|throw|null|echo|print|trait|namespace|final|yield|goto|instanceof|finally|try|catch)\b/i,
    'constant': /\b[A-Z0-9_]{2,}\b/,
    'comment': {
        pattern: /(^|[^\\])(?:\/\*[\w\W]*?\*\/|\/\/.*)/,
        lookbehind: true
    }
});

// Shell-like comments are matched after strings, because they are less
// common than strings containing hashes...
Prism.languages.insertBefore('php', 'class-name', {
    'shell-comment': {
        pattern: /(^|[^\\])#.*/,
        lookbehind: true,
        alias: 'comment'
    }
});

Prism.languages.insertBefore('php', 'keyword', {
    'delimiter': /\?>|<\?(?:php)?/i,
    'variable': /\$\w+\b/i,
    'package': {
        pattern: /(\\|namespace\s+|use\s+)[\w\\]+/,
        lookbehind: true,
        inside: {
            punctuation: /\\/
        }
    }
});

// Must be defined after the function pattern
Prism.languages.insertBefore('php', 'operator', {
    'property': {
        pattern: /(->)[\w]+/,
        lookbehind: true
    }
});

// Add HTML support of the markup language exists
if (Prism.languages.markup) {

    // Tokenize all inline PHP blocks that are wrapped in <?php ?>
    // This allows for easy PHP + markup highlighting
    Prism.hooks.add('before-highlight', function(env) {
        if (env.language !== 'php') {
            return;
        }

        env.tokenStack = [];

        env.backupCode = env.code;
        env.code = env.code.replace(/(?:<\?php|<\?)[\w\W]*?(?:\?>)/ig, function(match) {
            env.tokenStack.push(match);

            return '{{{PHP' + env.tokenStack.length + '}}}';
        });
    });

    // Restore env.code for other plugins (e.g. line-numbers)
    Prism.hooks.add('before-insert', function(env) {
        if (env.language === 'php') {
            env.code = env.backupCode;
            delete env.backupCode;
        }
    });

    // Re-insert the tokens after highlighting
    Prism.hooks.add('after-highlight', function(env) {
        if (env.language !== 'php') {
            return;
        }

        for (var i = 0, t; t = env.tokenStack[i]; i++) {
            // The replace prevents $$, $&, $`, $', $n, $nn from being interpreted as special patterns
            env.highlightedCode = env.highlightedCode.replace('{{{PHP' + (i + 1) + '}}}', Prism.highlight(t, env.grammar, 'php').replace(/\$/g, '$$$$'));
        }

        env.element.innerHTML = env.highlightedCode;
    });

    // Wrap tokens in classes that are missing them
    Prism.hooks.add('wrap', function(env) {
        if (env.language === 'php' && env.type === 'markup') {
            env.content = env.content.replace(/(\{\{\{PHP[0-9]+\}\}\})/g, "<span class=\"token php\">$1</span>");
        }
    });

    // Add the rules before all others
    Prism.languages.insertBefore('php', 'comment', {
        'markup': {
            pattern: /<[^?]\/?(.*?)>/,
            inside: Prism.languages.markup
        },
        'php': /\{\{\{PHP[0-9]+\}\}\}/
    });
}
;
(function (Prism) {
    Prism.languages.puppet = {
        'heredoc': [
            // Matches the content of a quoted heredoc string (subject to interpolation)
            {
                pattern: /(@\("([^"\r\n\/):]+)"(?:\/[nrts$uL]*)?\).*(?:\r?\n|\r))(?:.*(?:\r?\n|\r))*?[ \t]*\|?[ \t]*-?[ \t]*\2/,
                lookbehind: true,
                alias: 'string',
                inside: {
                    // Matches the end tag
                    'punctuation': /(?=\S).*\S(?= *$)/
                    // See interpolation below
                }
            },
            // Matches the content of an unquoted heredoc string (no interpolation)
            {
                pattern: /(@\(([^"\r\n\/):]+)(?:\/[nrts$uL]*)?\).*(?:\r?\n|\r))(?:.*(?:\r?\n|\r))*?[ \t]*\|?[ \t]*-?[ \t]*\2/,
                lookbehind: true,
                alias: 'string',
                inside: {
                    // Matches the end tag
                    'punctuation': /(?=\S).*\S(?= *$)/
                }
            },
            // Matches the start tag of heredoc strings
            {
                pattern: /@\("?(?:[^"\r\n\/):]+)"?(?:\/[nrts$uL]*)?\)/,
                alias: 'string',
                inside: {
                    'punctuation': {
                        pattern: /(\().+?(?=\))/,
                        lookbehind: true
                    }
                }
            }
        ],
        'multiline-comment': {
            pattern: /(^|[^\\])\/\*[\s\S]*?\*\//,
            lookbehind: true,
            alias: 'comment'
        },
        'regex': {
            // Must be prefixed with the keyword "node" or a non-word char
            pattern: /((?:\bnode\s+|[^\s\w\\]\s*))\/(?:[^\/\\]|\\[\s\S])+\/(?:[imx]+\b|\B)/,
            lookbehind: true,
            inside: {
                // Extended regexes must have the x flag. They can contain single-line comments.
                'extended-regex': {
                    pattern: /^\/(?:[^\/\\]|\\[\s\S])+\/[im]*x[im]*$/,
                    inside: {
                        'comment': /#.*/
                    }
                }
            }
        },
        'comment': {
            pattern: /(^|[^\\])#.*/,
            lookbehind: true
        },
        'string': {
            // Allow for one nested level of double quotes inside interpolation
            pattern: /(["'])(?:\$\{(?:[^'"}]|(["'])(?:(?!\2)[^\\]|\\[\s\S])*\2)+\}|(?!\1)[^\\]|\\[\s\S])*\1/,
            inside: {
                'double-quoted': {
                    pattern: /^"[\s\S]*"$/,
                    inside: {
                        // See interpolation below
                    }
                }
            }
        },
        'variable': {
            pattern: /\$(?:::)?\w+(?:::\w+)*/,
            inside: {
                'punctuation': /::/
            }
        },
        'attr-name': /(?:\w+|\*)(?=\s*=>)/,
        'function': [
            {
                pattern: /(\.)(?!\d)\w+/,
                lookbehind: true
            },
            /\b(?:contain|debug|err|fail|include|info|notice|realize|require|tag|warning)\b|\b(?!\d)\w+(?=\()/
        ],
        'number': /\b(?:0x[a-f\d]+|\d+(?:\.\d+)?(?:e-?\d+)?)\b/i,
        'boolean': /\b(?:true|false)\b/,
        // Includes words reserved for future use
        'keyword': /\b(?:application|attr|case|class|consumes|default|define|else|elsif|function|if|import|inherits|node|private|produces|type|undef|unless)\b/,
        'datatype': {
            pattern: /\b(?:Any|Array|Boolean|Callable|Catalogentry|Class|Collection|Data|Default|Enum|Float|Hash|Integer|NotUndef|Numeric|Optional|Pattern|Regexp|Resource|Runtime|Scalar|String|Struct|Tuple|Type|Undef|Variant)\b/,
            alias: 'symbol'
        },
        'operator': /=[=~>]?|![=~]?|<(?:<\|?|[=~|-])?|>[>=]?|->?|~>|\|>?>?|[*\/%+?]|\b(?:and|in|or)\b/,
        'punctuation': /[\[\]{}().,;]|:+/
    };

    var interpolation = [
        {
            // Allow for one nested level of braces inside interpolation
            pattern: /(^|[^\\])\$\{(?:[^'"{}]|\{[^}]*\}|(["'])(?:(?!\2)[^\\]|\\[\s\S])*\2)+\}/,
            lookbehind: true,
            inside: {
                'short-variable': {
                    // Negative look-ahead prevent wrong highlighting of functions
                    pattern: /(^\$\{)(?!\w+\()(?:::)?\w+(?:::\w+)*/,
                    lookbehind: true,
                    alias: 'variable',
                    inside: {
                        'punctuation': /::/
                    }
                },
                'delimiter': {
                    pattern: /^\$/,
                    alias: 'variable'
                },
                rest: Prism.util.clone(Prism.languages.puppet)
            }
        },
        {
            pattern: /(^|[^\\])\$(?:::)?\w+(?:::\w+)*/,
            lookbehind: true,
            alias: 'variable',
            inside: {
                'punctuation': /::/
            }
        }
    ];
    Prism.languages.puppet['heredoc'][0].inside.interpolation = interpolation;
    Prism.languages.puppet['string'].inside['double-quoted'].inside.interpolation = interpolation;
}(Prism));
Prism.languages.python= {
    'triple-quoted-string': {
        pattern: /"""[\s\S]+?"""|'''[\s\S]+?'''/,
        alias: 'string'
    },
    'comment': {
        pattern: /(^|[^\\])#.*/,
        lookbehind: true
    },
    'string': /("|')(?:\\?.)*?\1/,
    'function' : {
        pattern: /((?:^|\s)def[ \t]+)[a-zA-Z_][a-zA-Z0-9_]*(?=\()/g,
        lookbehind: true
    },
    'class-name': {
        pattern: /(\bclass\s+)[a-z0-9_]+/i,
        lookbehind: true
    },
    'keyword' : /\b(?:as|assert|async|await|break|class|continue|def|del|elif|else|except|exec|finally|for|from|global|if|import|in|is|lambda|pass|print|raise|return|try|while|with|yield)\b/,
    'boolean' : /\b(?:True|False)\b/,
    'number' : /\b-?(?:0[bo])?(?:(?:\d|0x[\da-f])[\da-f]*\.?\d*|\.\d+)(?:e[+-]?\d+)?j?\b/i,
    'operator' : /[-+%=]=?|!=|\*\*?=?|\/\/?=?|<[<=>]?|>[=>]?|[&|^~]|\b(?:or|and|not)\b/,
    'punctuation' : /[{}[\];(),.:]/
};

(function(Prism) {

    var javascript = Prism.util.clone(Prism.languages.javascript);

    Prism.languages.jsx = Prism.languages.extend('markup', javascript);
    Prism.languages.jsx.tag.pattern= /<\/?[\w\.:-]+\s*(?:\s+[\w\.:-]+(?:=(?:("|')(\\?[\w\W])*?\1|[^\s'">=]+|(\{[\w\W]*?\})))?\s*)*\/?>/i;

    Prism.languages.jsx.tag.inside['attr-value'].pattern = /=[^\{](?:('|")[\w\W]*?(\1)|[^\s>]+)/i;

    var jsxExpression = Prism.util.clone(Prism.languages.jsx);

    delete jsxExpression.punctuation

    jsxExpression = Prism.languages.insertBefore('jsx', 'operator', {
        'punctuation': /=(?={)|[{}[\];(),.:]/
    }, { jsx: jsxExpression });

    Prism.languages.insertBefore('inside', 'attr-value',{
        'script': {
            // Allow for one level of nesting
            pattern: /=(\{(?:\{[^}]*\}|[^}])+\})/i,
            inside: jsxExpression,
            'alias': 'language-javascript'
        }
    }, Prism.languages.jsx.tag);

}(Prism));

(function(Prism) {
    Prism.languages.sass = Prism.languages.extend('css', {
        // Sass comments don't need to be closed, only indented
        'comment': {
            pattern: /^([ \t]*)\/[\/*].*(?:(?:\r?\n|\r)\1[ \t]+.+)*/m,
            lookbehind: true
        }
    });

    Prism.languages.insertBefore('sass', 'atrule', {
        // We want to consume the whole line
        'atrule-line': {
            // Includes support for = and + shortcuts
            pattern: /^(?:[ \t]*)[@+=].+/m,
            inside: {
                'atrule': /(?:@[\w-]+|[+=])/m
            }
        }
    });
    delete Prism.languages.sass.atrule;


    var variable = /((\$[-_\w]+)|(#\{\$[-_\w]+\}))/i;
    var operator = [
        /[+*\/%]|[=!]=|<=?|>=?|\b(?:and|or|not)\b/,
        {
            pattern: /(\s+)-(?=\s)/,
            lookbehind: true
        }
    ];

    Prism.languages.insertBefore('sass', 'property', {
        // We want to consume the whole line
        'variable-line': {
            pattern: /^[ \t]*\$.+/m,
            inside: {
                'punctuation': /:/,
                'variable': variable,
                'operator': operator
            }
        },
        // We want to consume the whole line
        'property-line': {
            pattern: /^[ \t]*(?:[^:\s]+ *:.*|:[^:\s]+.*)/m,
            inside: {
                'property': [
                    /[^:\s]+(?=\s*:)/,
                    {
                        pattern: /(:)[^:\s]+/,
                        lookbehind: true
                    }
                ],
                'punctuation': /:/,
                'variable': variable,
                'operator': operator,
                'important': Prism.languages.sass.important
            }
        }
    });
    delete Prism.languages.sass.property;
    delete Prism.languages.sass.important;

    // Now that whole lines for other patterns are consumed,
    // what's left should be selectors
    delete Prism.languages.sass.selector;
    Prism.languages.insertBefore('sass', 'punctuation', {
        'selector': {
            pattern: /([ \t]*)\S(?:,?[^,\r\n]+)*(?:,(?:\r?\n|\r)\1[ \t]+\S(?:,?[^,\r\n]+)*)*/,
            lookbehind: true
        }
    });

}(Prism));
Prism.languages.sql= {
    'comment': {
        pattern: /(^|[^\\])(?:\/\*[\w\W]*?\*\/|(?:--|\/\/|#).*)/,
        lookbehind: true
    },
    'string' : {
        pattern: /(^|[^@\\])("|')(?:\\?[\s\S])*?\2/,
        lookbehind: true
    },
    'variable': /@[\w.$]+|@("|'|`)(?:\\?[\s\S])+?\1/,
    'function': /\b(?:COUNT|SUM|AVG|MIN|MAX|FIRST|LAST|UCASE|LCASE|MID|LEN|ROUND|NOW|FORMAT)(?=\s*\()/i, // Should we highlight user defined functions too?
    'keyword': /\b(?:ACTION|ADD|AFTER|ALGORITHM|ALL|ALTER|ANALYZE|ANY|APPLY|AS|ASC|AUTHORIZATION|BACKUP|BDB|BEGIN|BERKELEYDB|BIGINT|BINARY|BIT|BLOB|BOOL|BOOLEAN|BREAK|BROWSE|BTREE|BULK|BY|CALL|CASCADED?|CASE|CHAIN|CHAR VARYING|CHARACTER (?:SET|VARYING)|CHARSET|CHECK|CHECKPOINT|CLOSE|CLUSTERED|COALESCE|COLLATE|COLUMN|COLUMNS|COMMENT|COMMIT|COMMITTED|COMPUTE|CONNECT|CONSISTENT|CONSTRAINT|CONTAINS|CONTAINSTABLE|CONTINUE|CONVERT|CREATE|CROSS|CURRENT(?:_DATE|_TIME|_TIMESTAMP|_USER)?|CURSOR|DATA(?:BASES?)?|DATETIME|DBCC|DEALLOCATE|DEC|DECIMAL|DECLARE|DEFAULT|DEFINER|DELAYED|DELETE|DENY|DESC|DESCRIBE|DETERMINISTIC|DISABLE|DISCARD|DISK|DISTINCT|DISTINCTROW|DISTRIBUTED|DO|DOUBLE(?: PRECISION)?|DROP|DUMMY|DUMP(?:FILE)?|DUPLICATE KEY|ELSE|ENABLE|ENCLOSED BY|END|ENGINE|ENUM|ERRLVL|ERRORS|ESCAPE(?:D BY)?|EXCEPT|EXEC(?:UTE)?|EXISTS|EXIT|EXPLAIN|EXTENDED|FETCH|FIELDS|FILE|FILLFACTOR|FIRST|FIXED|FLOAT|FOLLOWING|FOR(?: EACH ROW)?|FORCE|FOREIGN|FREETEXT(?:TABLE)?|FROM|FULL|FUNCTION|GEOMETRY(?:COLLECTION)?|GLOBAL|GOTO|GRANT|GROUP|HANDLER|HASH|HAVING|HOLDLOCK|IDENTITY(?:_INSERT|COL)?|IF|IGNORE|IMPORT|INDEX|INFILE|INNER|INNODB|INOUT|INSERT|INT|INTEGER|INTERSECT|INTO|INVOKER|ISOLATION LEVEL|JOIN|KEYS?|KILL|LANGUAGE SQL|LAST|LEFT|LIMIT|LINENO|LINES|LINESTRING|LOAD|LOCAL|LOCK|LONG(?:BLOB|TEXT)|MATCH(?:ED)?|MEDIUM(?:BLOB|INT|TEXT)|MERGE|MIDDLEINT|MODIFIES SQL DATA|MODIFY|MULTI(?:LINESTRING|POINT|POLYGON)|NATIONAL(?: CHAR VARYING| CHARACTER(?: VARYING)?| VARCHAR)?|NATURAL|NCHAR(?: VARCHAR)?|NEXT|NO(?: SQL|CHECK|CYCLE)?|NONCLUSTERED|NULLIF|NUMERIC|OFF?|OFFSETS?|ON|OPEN(?:DATASOURCE|QUERY|ROWSET)?|OPTIMIZE|OPTION(?:ALLY)?|ORDER|OUT(?:ER|FILE)?|OVER|PARTIAL|PARTITION|PERCENT|PIVOT|PLAN|POINT|POLYGON|PRECEDING|PRECISION|PREV|PRIMARY|PRINT|PRIVILEGES|PROC(?:EDURE)?|PUBLIC|PURGE|QUICK|RAISERROR|READ(?:S SQL DATA|TEXT)?|REAL|RECONFIGURE|REFERENCES|RELEASE|RENAME|REPEATABLE|REPLICATION|REQUIRE|RESTORE|RESTRICT|RETURNS?|REVOKE|RIGHT|ROLLBACK|ROUTINE|ROW(?:COUNT|GUIDCOL|S)?|RTREE|RULE|SAVE(?:POINT)?|SCHEMA|SELECT|SERIAL(?:IZABLE)?|SESSION(?:_USER)?|SET(?:USER)?|SHARE MODE|SHOW|SHUTDOWN|SIMPLE|SMALLINT|SNAPSHOT|SOME|SONAME|START(?:ING BY)?|STATISTICS|STATUS|STRIPED|SYSTEM_USER|TABLES?|TABLESPACE|TEMP(?:ORARY|TABLE)?|TERMINATED BY|TEXT(?:SIZE)?|THEN|TIMESTAMP|TINY(?:BLOB|INT|TEXT)|TOP?|TRAN(?:SACTIONS?)?|TRIGGER|TRUNCATE|TSEQUAL|TYPES?|UNBOUNDED|UNCOMMITTED|UNDEFINED|UNION|UNIQUE|UNPIVOT|UPDATE(?:TEXT)?|USAGE|USE|USER|USING|VALUES?|VAR(?:BINARY|CHAR|CHARACTER|YING)|VIEW|WAITFOR|WARNINGS|WHEN|WHERE|WHILE|WITH(?: ROLLUP|IN)?|WORK|WRITE(?:TEXT)?)\b/i,
    'boolean': /\b(?:TRUE|FALSE|NULL)\b/i,
    'number': /\b-?(?:0x)?\d*\.?[\da-f]+\b/,
    'operator': /[-+*\/=%^~]|&&?|\|?\||!=?|<(?:=>?|<|>)?|>[>=]?|\b(?:AND|BETWEEN|IN|LIKE|NOT|OR|IS|DIV|REGEXP|RLIKE|SOUNDS LIKE|XOR)\b/i,
    'punctuation': /[;[\]()`,.]/
};
Prism.languages.twig = {
    'comment': /\{#[\s\S]*?#\}/,
    'tag': {
        pattern: /\{\{[\s\S]*?\}\}|\{%[\s\S]*?%\}/,
        inside: {
            'ld': {
                pattern: /^(?:\{\{\-?|\{%\-?\s*\w+)/,
                inside: {
                    'punctuation': /^(?:\{\{|\{%)\-?/,
                    'keyword': /\w+/
                }
            },
            'rd': {
                pattern: /\-?(?:%\}|\}\})$/,
                inside: {
                    'punctuation': /.*/
                }
            },
            'string': {
                pattern: /("|')(?:\\?.)*?\1/,
                inside: {
                    'punctuation': /^['"]|['"]$/
                }
            },
            'keyword': /\b(?:even|if|odd)\b/,
            'boolean': /\b(?:true|false|null)\b/,
            'number': /\b-?(?:0x[\dA-Fa-f]+|\d*\.?\d+([Ee][-+]?\d+)?)\b/,
            'operator': [
                {
                    pattern: /(\s)(?:and|b\-and|b\-xor|b\-or|ends with|in|is|matches|not|or|same as|starts with)(?=\s)/,
                    lookbehind: true
                },
                /[=<>]=?|!=|\*\*?|\/\/?|\?:?|[-+~%|]/
            ],
            'property': /\b[a-zA-Z_][a-zA-Z0-9_]*\b/,
            'punctuation': /[()\[\]{}:.,]/
        }
    },

    // The rest can be parsed as HTML
    'other': {
        // We want non-blank matches
        pattern: /\S(?:[\s\S]*\S)?/,
        inside: Prism.languages.markup
    }
};

Prism.languages.yaml = {
    'scalar': {
        pattern: /([\-:]\s*(![^\s]+)?[ \t]*[|>])[ \t]*(?:((?:\r?\n|\r)[ \t]+)[^\r\n]+(?:\3[^\r\n]+)*)/,
        lookbehind: true,
        alias: 'string'
    },
    'comment': /#.*/,
    'key': {
        pattern: /(\s*[:\-,[{\r\n?][ \t]*(![^\s]+)?[ \t]*)[^\r\n{[\]},#]+?(?=\s*:\s)/,
        lookbehind: true,
        alias: 'atrule'
    },
    'directive': {
        pattern: /(^[ \t]*)%.+/m,
        lookbehind: true,
        alias: 'important'
    },
    'datetime': {
        pattern: /([:\-,[{]\s*(![^\s]+)?[ \t]*)(\d{4}-\d\d?-\d\d?([tT]|[ \t]+)\d\d?:\d{2}:\d{2}(\.\d*)?[ \t]*(Z|[-+]\d\d?(:\d{2})?)?|\d{4}-\d{2}-\d{2}|\d\d?:\d{2}(:\d{2}(\.\d*)?)?)(?=[ \t]*($|,|]|}))/m,
        lookbehind: true,
        alias: 'number'
    },
    'boolean': {
        pattern: /([:\-,[{]\s*(![^\s]+)?[ \t]*)(true|false)[ \t]*(?=$|,|]|})/im,
        lookbehind: true,
        alias: 'important'
    },
    'null': {
        pattern: /([:\-,[{]\s*(![^\s]+)?[ \t]*)(null|~)[ \t]*(?=$|,|]|})/im,
        lookbehind: true,
        alias: 'important'
    },
    'string': {
        pattern: /([:\-,[{]\s*(![^\s]+)?[ \t]*)("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')(?=[ \t]*($|,|]|}))/m,
        lookbehind: true
    },
    'number': {
        pattern: /([:\-,[{]\s*(![^\s]+)?[ \t]*)[+\-]?(0x[\da-f]+|0o[0-7]+|(\d+\.?\d*|\.?\d+)(e[\+\-]?\d+)?|\.inf|\.nan)[ \t]*(?=$|,|]|})/im,
        lookbehind: true
    },
    'tag': /![^\s]+/,
    'important': /[&*][\w]+/,
    'punctuation': /---|[:[\]{}\-,|>?]|\.\.\./
};

(function() {

    if (typeof self === 'undefined' || !self.Prism || !self.document) {
        return;
    }

    Prism.hooks.add('complete', function (env) {
        if (!env.code) {
            return;
        }

        // works only for <code> wrapped inside <pre> (not inline)
        var pre = env.element.parentNode;
        var clsReg = /\s*\bline-numbers\b\s*/;
        if (
            !pre || !/pre/i.test(pre.nodeName) ||
                // Abort only if nor the <pre> nor the <code> have the class
            (!clsReg.test(pre.className) && !clsReg.test(env.element.className))
        ) {
            return;
        }

        if (env.element.querySelector(".line-numbers-rows")) {
            // Abort if line numbers already exists
            return;
        }

        if (clsReg.test(env.element.className)) {
            // Remove the class "line-numbers" from the <code>
            env.element.className = env.element.className.replace(clsReg, '');
        }
        if (!clsReg.test(pre.className)) {
            // Add the class "line-numbers" to the <pre>
            pre.className += ' line-numbers';
        }

        var match = env.code.match(/\n(?!$)/g);
        var linesNum = match ? match.length + 1 : 1;
        var lineNumbersWrapper;

        var lines = new Array(linesNum + 1);
        lines = lines.join('<span></span>');

        lineNumbersWrapper = document.createElement('span');
        lineNumbersWrapper.className = 'line-numbers-rows';
        lineNumbersWrapper.innerHTML = lines;

        if (pre.hasAttribute('data-start')) {
            pre.style.counterReset = 'linenumber ' + (parseInt(pre.getAttribute('data-start'), 10) - 1);
        }

        env.element.appendChild(lineNumbersWrapper);

    });

}());
(function(){

    if (
        typeof self !== 'undefined' && !self.Prism ||
        typeof global !== 'undefined' && !global.Prism
    ) {
        return;
    }

    var url = /\b([a-z]{3,7}:\/\/|tel:)[\w\-+%~/.:#=?&amp;]+/,
        email = /\b\S+@[\w.]+[a-z]{2}/,
        linkMd = /\[([^\]]+)]\(([^)]+)\)/,

    // Tokens that may contain URLs and emails
        candidates = ['comment', 'url', 'attr-value', 'string'];

    Prism.hooks.add('before-highlight', function(env) {
        // Abort if grammar has already been processed
        if (!env.grammar || env.grammar['url-link']) {
            return;
        }
        Prism.languages.DFS(env.grammar, function (key, def, type) {
            if (candidates.indexOf(type) > -1 && Prism.util.type(def) !== 'Array') {
                if (!def.pattern) {
                    def = this[key] = {
                        pattern: def
                    };
                }

                def.inside = def.inside || {};

                if (type == 'comment') {
                    def.inside['md-link'] = linkMd;
                }
                if (type == 'attr-value') {
                    Prism.languages.insertBefore('inside', 'punctuation', { 'url-link': url }, def);
                }
                else {
                    def.inside['url-link'] = url;
                }

                def.inside['email-link'] = email;
            }
        });
        env.grammar['url-link'] = url;
        env.grammar['email-link'] = email;
    });

    Prism.hooks.add('wrap', function(env) {
        if (/-link$/.test(env.type)) {
            env.tag = 'a';

            var href = env.content;

            if (env.type == 'email-link' && href.indexOf('mailto:') != 0) {
                href = 'mailto:' + href;
            }
            else if (env.type == 'md-link') {
                // Markdown
                var match = env.content.match(linkMd);

                href = match[2];
                env.content = match[1];
            }

            env.attributes.href = href;
        }
    });

})();
