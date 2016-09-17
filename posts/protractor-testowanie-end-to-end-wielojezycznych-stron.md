~~~
title: Protractor - testowanie end-to-end wielojęzycznych stron
category: JavaScript
comments: true
tags: 
    - end-to-end
    - protractor
identifier: protractor-testowanie-end-to-end-wielojezycznych-stron
created_at: 2016-04-25
~~~

Testy **end-to-end** pozwalają zautomatyzować proces testowania aplikacji. Jeśli nasz projekt będzie dostępny tylko w jednym języku, to nie powinniśmy mieć większych problemów z napisaniem takich testów. Problem zaczyna się pojawiać, kiedy nasze testy powinny pokrywać kilka wersji językowych. Poszczególne fragmenty aplikacji mogą różnić się nie tylko tekstami, ale również opcjami w polach formularzu, czy formatowaniem liczb. 

#### Definicja problemu

Ten artykuł nie pokaże Ci w jaki sposób pisać testy *e2e*. Nie będzie również o tym czym jest [Protractor](http://angular.github.io/protractor/#/) i&nbsp;jak go użyć. Nie wykluczone, że w przyszłości powstanie wpis, który rozjaśni te wszystkie tajemnicze pojęcia, ale w tym momencie zakładam, że znasz te narzędzie oraz testy e2e nie są dla Ciebie odkryciem.

Więc, w czym problem? Piszemy testy, odpalamy w konsoli polecenie, *wirtualny użyszkodnik* wchodzi na stronę, wypełnia formularze i sprawdza, czy aplikacja poprawnie odpowiada na jego żądania. Mniej więcej wszystkie testy end-to-end można wpisać w ten schemat. Elementami stałymi każdego testu (niezależnie od języka strony) są formularze oraz zachowanie aplikacji. 

Możemy zatem napisać dwa razy taki sam test - dla strony wyświetlanej w języku polskim, jak&nbsp;i&nbsp;w&nbsp;języku angielskim. Utrzymanie takiego testu będzie problemem - [powtarzanie kodu nie jest zjawiskiem akceptowanym](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself). Jeśli w aplikacji coś się zmieni, testy również muszą zostać zmienione. Do zmiany mamy co najmniej dwa testy (zakłądając, że mamy aplikację dwujęzyczną). Pojedynczy przypadek nie będzie problemem. Co jednak w sytuacji, kiedy testów mamy więcej? 

#### Jeden test obsługuje kilka przypadków

Jeden test powinien obsługiwać jedną ściężkę. Czy możemy napisać mechanizm, który uruchomi raz napisane testy kilka razy, z uwzględnieniem aktualnego języka w aplikacji? Ostatnio miałem okazję odpowiedzieć sobie na to pytanie. Rozwiązaniem problemu będą dwie klasy.

Przeanalizujmy pierwszą z nich - `TestParser` (kluczem są komentarze):

```js
"use strict";

/**
 * Zadaniem tej klasy jest parsowanie scenariuszy testowych, które są takie same
 * zarówno w wersji polskiej, jak i angielskiej.
 *
 * Obiekt `pageUrls` powinien być zdefiniowany według reguł:
 *   - klucz = nazwa języka,
 *   - wartość = url do strony
 *
 * @param {Object <string, string>} pageUrls
 * @param {Context} context [context=undefined]
 * @constructor
 */
let TestParser = function (pageUrls, context) {
    this.pageUrls = pageUrls;
    this.context = context;
};

/**
 * Przykładowe wejście (parametr `testCases`):
 * {
 *      'should contain logo': () => {
 *          expect(aboutUs.logo.isDisplayed()).toBeTruthy();
 *      }
 *  }
 *
 * @param {Object <string, Function>} testCases
 */
TestParser.prototype.parse = function (testCases) {
    let self = this,
        items = Object.keys(testCases);

    Object.keys(this.pageUrls).forEach(lang => {
        // W ten sposób newLang otrzymuje poprawną wartość, a nie ostatnią
        // zapisaną w zmiennej lang (kopiowanie parametru)
        (function (newLang) {
            describe(newLang.toUpperCase(), () => {
                beforeEach(() => {
                    browser.get(this.pageUrls[newLang]);
                });

                items.forEach(row => {
                    // Dzięki wrapperowi, podczas uruchamiania testów, context
                    // może przyjąć odpowiednie wartości
                    let wrapper = function() {
                        if (self.context) {
                            self.context.setLang(newLang);
                        }

                        return testCases[row].call(this);
                    };

                    it(row, wrapper);
                });
            });
        }.bind(this))(lang);
    });
};

module.exports = TestParser;
```

`TestParser` wykorzystuje drugą klasę `Context`. Podobnie jak wcześniej - przyjrzyj się komentarzom:

```js
"use strict";

/**
 * Obiekt kontekstu jest wykorzystywany podczas testów.
 * Przed uruchomieniem testu, parser ustawia odpowiednie wartości parametrów.
 *
 * Dzięki temu, przypadki testowe mogą być takie same dla różnych języków,
 * a sam język można wykryć i ustawić odpowiedni parametr testu.
 *
 * @constructor
 */
let Context = function () {
    /**
     * @type {string}
     */
    this.lang = null;
};

/**
 * @param {string} lang
 * @returns {void}
 */
Context.prototype.setLang = function (lang) {
    this.lang = lang;
};

/**
 * @returns {string}
 */
Context.prototype.getLang = function () {
    return this.lang;
};

/**
 * @returns {boolean}
 */
Context.prototype.isPolishUrl = function () {
    return this.lang === 'pl';
};

/**
 * @returns {boolean}
 */
Context.prototype.isEnglishUrl = function () {
    return this.lang === 'en';
};

module.exports = Context;
```

Te dwie klasy wyrywkowo wykorzystują [nowości wprowadzone w ES2015](http://es6-features.org). Wyrywkowo,
ponieważ ten kod jest uruchamiany w przeglądarce (i nie jest *kompilowany* przez inne narzędzia), a te
[jeszcze nie intepretują zapisu ES2015 poprawnie](https://kangax.github.io/compat-table/es6/).

Jak wspomniałem w komentarzach klas - ich użycie pozwala napisać jeden test, który zostanie uruchomiony 
na każdej stronie, które zostaną zdefiniowane.

##### Jak to wygląda w praktyce?

Przyjrzyjmy się przykładowi poniżej:

```js
// obiekty TestParser i Context można wczytać za pomocą require

describe('Recipient view', () => {
    const context = new Context(),
        page = require('./pages/recipients.po'), // https://github.com/angular/protractor/blob/master/docs/page-objects.md
        testParser = new TestParser({
            pl: '/pl/odbiorcy',
            en: '/en/recipients'
        }, context);

    testParser.parse({
        'should display logo': () => {
            if (context.isPolishUrl()) {
                expect(page.logoPl.isPresent()).toBe(true);
                expect(page.logoEn.isPresent()).toBe(false);
            }
            
            if (context.isEnglishUrl()) {
                expect(page.logoPl.isPresent()).toBe(false);
                expect(page.logoEn.isPresent()).toBe(true);
            }
            
            const expectedPrice = (context.isPolishUrl()) ? '100,00' : '100.00';
            expect(page.Price.isPresent()).toBe(expectedPrice);
        }
    });
});
```

Podczas uruchamiania powyższego zestawu testów, wykonany zostanie kod:

```js
describe('PL', () => {
    beforeEach(() => {
        browser.get('/pl/odbiorcy');
    });

    it('should display logo', /* ... */);
});

describe('EN', () => {
    beforeEach(() => {
        browser.get('/en/recipients');
    });

    it('should display logo', /* ... */);
});
```

#### Podsumowując

Dzięki klasom `TestParser` oraz `Context` udało się rozwiązać problem testowania stron wielojęzycznych. Test mógł się lekko skomplikować, ale jeśli przyjdzie nam coś w w nich zmieniać, to zmienimy to tylko w jednym miejscu.

Kod, który znajduje się w testowanej funkcji można wydzielić do mniejszych modułów. W ten sposób możemy uniknąć nadmiaru instrukcji warunkowych, co prowadzi do zwiększenia czytelności testów.

Znasz inny sposób, który rozwiązuje poruszony przeze mnie problem? Daj znać. Chętnie zapoznam się z innymi rozwiązaniami!
