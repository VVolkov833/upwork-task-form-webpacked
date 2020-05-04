import 'bootstrap/dist/css/bootstrap.min.css';
import '@/forms.css';

'use strict';

(function() {
    // draw the form
    function formBuild(structure, container) {
        var self = formBuild;

        // list of fields formats
        self.input = function(key, data) {
            return `
                <div class="form-group">
                    <input type="text" name="${key}" class="form-control" placeholder="${data.title}" ${data.autoComplete ? 'data-autocomplete="'+data.autoComplete+'"' : ''}>
                </div>
            `;
        };// eslint-disable-next-line
        self.submit = function(key, data) {
            return `
                <div class="form-group">
                    <button class="btn btn-primary" ${key ? 'name="'+key+'"' : ''}>
                        ${data.title ? data.title : 'Submit'}
                    </button>
                </div>
            `;
        };
        self.alert = function() {
            return `
                <div class="alert fade hide"></div>  
            `;
        };
        
        // print the form
        var html = '';
        for (var k in structure) {
            if ( !structure[k].type || !self[structure[k].type] ) {
                continue;
            }

            // format the field by type
            html += self[structure[k].type](k, structure[k]);

        }
        html += self.alert();
        document.querySelector( '#'+container.id ).innerHTML = html;

        // store validation rules inside the fields objects
        for (k in structure) { // or just use let instead of var
            if ( !structure[k].validate ) {
                continue;
            }
            (function(k) {

                container.querySelector( '[name='+k+']' ).validationRules = structure[k].validate;
                
                // load & store the lists of obligatory options inside the form object
                if ( structure[k].validate.contained ) {

                    if ( !container.listOfOptions ) {
                        container.listOfOptions = {};
                    }

                    fetchGetJSON( 'lists/' + structure[k].validate.contained + '.json' )
                        .then( function(data) {
                            if ( !data ) {
                                return;
                            }
                            container.listOfOptions[structure[k].validate.contained] = data;
                        });
                }
            })(k);
        }


        // apply autocomplete to demanding fields
        autoComplete();
        
        // submit event
        container.addEventListener( 'submit', function(e) {
            e.preventDefault();
            
            var canSubmit = true;
            this.querySelectorAll( 'input, textarea, select' ).forEach( function( input ) {
                if ( !fieldIsValid( input ) ) {
                    canSubmit = false;
                }
            });
            
            if ( canSubmit ) {
                formSubmit();
                return;
            }
            
            formAlert( 'warning', 'Some fields are not properly filled.' );
        });

        function fieldIsValid(input) {
            var val = input.value,
                rules = input.validationRules;

            markRestore();
                
            if ( !rules ) {
                return true;
            }
            
            if ( rules.notEmpty && val === '' ) {
                markInvalid( 'Please fill in the field' );
                return false;
            }

            if ( !isNaN( rules.minLength ) && val.length < rules.minLength ) {
                markInvalid( 'The content is too short, min length is ' + rules.minLength );
                return false;
            }

            if ( rules.contained && !container.listOfOptions[rules.contained][val] ) {
                markInvalid( 'No such value found in the list of ' + rules.contained );
                return false;
            }

            if ( rules.regExpReplace && !regExpReplaceTest() ) {
                // markInvalid is inside regExpReplaceTest()
                return false;
            }
                
            else if ( rules.regExp && !RegExp( rules.regExp[0], rules.regExp[1] ).test( val ) ) {
                markInvalid( 'The content doesnt fit the format' );
                return false;
            }

            return true;
            
            function markInvalid(text) {
                input.classList.add( 'invalid' );
                var invalidMessage = document.createElement( 'div' );
                invalidMessage.className = 'invalid-message';
                invalidMessage.innerHTML = text;
                input.parentNode.appendChild( invalidMessage );
            }
            
            function markRestore() {
                if ( input.parentNode.querySelector( '.invalid-message' ) ) {
                    input.parentNode.querySelector( '.invalid-message' ).remove();
                }
                input.classList.remove( 'invalid' );                
            }
            
            function regExpReplaceTest() {
                var fieldName = rules.regExpReplace[0],
                    optionsId = rules.regExpReplace[1],
                    field = container.querySelector( '*[name='+fieldName+']' );

                if ( !field || !field.value ) {
                    return true;
                }

                if ( !container.listOfOptions || !container.listOfOptions[optionsId] || !container.listOfOptions[optionsId][field.value] ) {
                    return true;
                }

                var regexp  = container.listOfOptions[optionsId][field.value][input.name+'-regexp'],
                    example = container.listOfOptions[optionsId][field.value][input.name+'-example'];

                if ( !regexp ) {
                    return true;
                }

                if ( regexp && !RegExp( regexp[0], regexp[1] ).test( val ) ) {
                    markInvalid( 'The format is supposed to fit ' + field.value + (example ? ', for example '+example : '') );
                    return false;
                }

                return true;
            }
        }

        function formSubmit() {
            
            // collect values
            var values = {};
            container.querySelectorAll( 'input, textarea, select' ).forEach( function( input ) {
                values[input.name] = input.value;
            });

            // loading visual effect
            var submitButton = container.querySelector( 'button[name=submit]' ),
                submitText = submitButton.innerHTML;

            loadingEffect();
            
            fetchPostStatus( 'post.php', values )
                .then( function (data) {
                    if ( data === 'success' ) {
                        formAlert( 'success', 'Thank you for filling the form!' );
                        container.reset();
                        return;
                    }
                    formAlert( 'danger', 'Some problem has occurred, please try again later.' );
                    setTimeout( formAlertHide, 3000 );
                })
                .finally(
                    notLoadingEffect
                 );

            function loadingEffect() {
                submitButton.innerHTML = '<span class="spinner-grow spinner-grow-sm"></span> Loading..';
                submitButton.disabled = true;
            }

            function notLoadingEffect() {
                submitButton.innerHTML = submitText;
                submitButton.disabled = false;
            }

        }
        
        function formAlert(view, text) {
            formAlertHide();
            var alertField = container.querySelector( '.alert' );
            alertField.innerHTML = text;
            alertField.classList.remove( 'hide' )
            alertField.classList.add( 'alert-' + view, 'show' );
        }

        function formAlertHide() {
            var alertField = container.querySelector( '.alert' );
            alertField.classList.remove( 'alert-success', 'alert-warning', 'alert-danger', 'show' );
            alertField.classList.add( 'hide' );
        }
        
    }


    // set autocomplete
    function autoComplete() {
        document.querySelectorAll( 'form.the-form[id]' ).forEach( function( form ) {
            form.querySelectorAll( 'form.the-form *[data-autocomplete]' ).forEach( function( input ) {

                // the hint div, suggesting the autocomplete variant
                var hintDiv = document.createElement( 'div' );
                hintDiv.className = 'autocomplete';
                input.parentNode.insertBefore(hintDiv, input.nextSibling);
                input.hintDiv = hintDiv;
                
                // get the autocomplete data
                var autocompleteId = input.getAttribute( 'data-autocomplete' );
                if ( form.listOfOptions && form.listOfOptions[autocompleteId] ) {
                    autoCompleteSuggest( form.listOfOptions[autocompleteId], input );
                } else {
                    fetchGetJSON( 'lists/' + autocompleteId + '.json' )
                        .then( function(data) {
                            if ( !data ) {
                                return;
                            }
                            autoCompleteSuggest( data, input );
                        });
                }

            });
        });
        
        function autoCompleteSuggest(data, input) {

            // convert the object to arrays of hints and auto-replace values
            var hintsInit = [], // list of hints
                hintsAlts = [], // list of hints' alt names
                hints = {}, // final list of hints
                autoReplace = {}; // list of replacements for alt values to initial ones

            for (var k in data) {
                hintsInit.push(k);
                
                if ( data[k].alt ) {
                    hintsAlts = hintsAlts.concat( data[k].alt );

                    data[k].alt.forEach( function(a) {
                        autoReplace[a.toLowerCase()] = k;
                    });
                }
            }
            
            hintsInit.concat( hintsAlts ).forEach( function(a) {
                hints[a] = a.toLowerCase();
            });

            // track changing the value
            input.addEventListener( 'focus', function() {
                this.hintDiv.realHint = this.hintDiv.innerHTML = this.value;
            });
            input.addEventListener( 'input', function() {
                var val = this.value.toLowerCase();

                this.hintDiv.innerHTML = this.hintDiv.realHint = '';

                if ( val.length < 1 ) {
                    return;
                }

                // get the first matching value
                for (var k in hints) {
                    if ( hints[k].indexOf(val) === 0 ) {
                        this.hintDiv.realHint = k;
                        this.hintDiv.innerHTML = this.value.slice( 0, val.length ) + k.slice( val.length ); // cases issue solving
                        break;
                    }
                }
            });
            
            // apply the value
            input.addEventListener( 'keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                }
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'Enter') {
                    this.value = this.hintDiv.innerHTML = this.hintDiv.realHint;
                }
            });
            
            // replace alt value with a primary one if mandatory
            input.addEventListener( 'blur', function() {
                if ( !this.hintDiv.innerHTML ) {
                    return;
                }
                
                this.value = this.hintDiv.realHint;
                this.hintDiv.innerHTML = this.hintDiv.realHint = '';
                
                // ++ add a case, where `contained` !== `autocomplete`
                if ( !input.validationRules.contained || input.validationRules.contained !== input.getAttribute( 'data-autocomplete' ) ) {
                    return;
                }

                var val = this.value.toLowerCase();
                if ( autoReplace[val] ) {
                    this.value = autoReplace[val];
                }
            });
            
        }
    }
    
    // data fetching functions
    function fetchGetJSON(url) {
       return fetch( url, {
            method: 'GET',
            mode: 'same-origin',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then( function(response) {
            if ( !response.ok ) {
                throw Error(response.statusText);
            }
            return response.json();
        });
    }

    function fetchPostStatus(url, body) {
        return fetch( url, {
            method: 'POST',
            mode: 'same-origin',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            body: JSON.stringify(body)
        })
        .then(
            function(response) {
                if ( response.status !== 200 ) { // specified in the task
                    throw Error(response.statusText);
                }
                return 'success';
            }
        );
    }

    // load & print the forms, which are found on the page
    document.querySelectorAll( 'form.the-form' ).forEach( function( form ) {
        if ( !form.id ) {
            return;
        }

        fetchGetJSON( 'forms/' + form.id + '-fields.json' )
            .then( function(data) {
                if ( !data ) {
                    return;
                }
                formBuild( data, form );
            });
    });
    
})();

