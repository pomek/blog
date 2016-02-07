---
title: >-
    String Calculator i pierwszy kontakt z TDD
layout: post
categories: 
    - PHP
comments: true
tags: 
    - unit tests
    - TDD
identifier: string-calculator-i-pierwszy-kontakt-z-tdd
---

Niedawno napisałem artykuł na temat [testów jednostkowych]({% post_url 2016-02-01-po-co-mi-te-testy-jednostkowe %}), którego treść mocno skupiła się na teorii. Nie pokazałem żadnych narzędzi ani sposobów jak takie testy pisać. W tym artykule rozwiążę krótkie ćwiczenie (*Code Kata*) zgodnie z metodyką **TDD**. Jako ciekawostkę dodam, swój pierwszy kontakt z **TDD** jak i testami, również doświadczyłem z tym zadaniem.

Słowem krótkiego wstępu, czym jest wyżej wspomniane *Code Kata*? **Kata** to słowo pochodzenia japońskiego, które ogólnie oznacza wykonywanie ćwiczeń. Natomiast **Code Kata** to ćwiczenia programistyczne, które mają na celu pomóc programiście ulepszyć swoje umiejętności.

---

Tematem dzisiejszego artykułu będzie ćwiczenie [**„String Calculator”**](http://osherove.com/tdd-kata-1/). Zanim jednak zaczniemy,
potrzebujemy kilku narzędzi oraz reguł, które musimy przestrzegać:

* *zainstaluj* [**PHPSpec**](http://phpspec.readthedocs.org/en/latest/) w miejscu, gdzie będziesz rozwiązywał zadanie; *PHPSpec* to biblioteka pozwalająca opisywać zachowanie klas w PHP,
* jeśli zamiast *PHPSpec* wolisz użyć [**PHPUnit**](https://phpunit.de) - nie widzę przeszkód,
* zadania rozwiązuj zgodnie z zasadą [**Red-Green-Refactor**](http://www.jamesshore.com/Blog/Red-Green-Refactor.html); najpierw test nieprzechodzący, następnie test przechodzący, na końcu refaktoring kodu,
* **nie zaglądaj do pozostałych zadań**; interesuje nas konkretny punkt w danym momencie,
* rozwiązuj tylko **jeden punkt zadania w tym samym czasie**; celem jest nauka pracy inkrementalnej, stopniowej,
* pamiętaj żeby testować tylko **prawidłowe dane wejściowe**; to są ćwiczenia i nieprawidłowy *input* nas nie interesuje.

#### String Calculator

Tematem ćwiczenia jest napisanie klasy `StringCalculator`, której zadaniem będzie dodawanie liczb zapisanych w postaci stringu. Początkowo dane wejściowe będą bardzo proste. Wraz z kolejnymi etapami, poziom skomplikowania danych wejściowych będzie rósł.

##### Zadanie 1.

Celem zadania jest stworzenie metody, która dla pustego stringu zwróci `0`, dla jednej liczby - wartość tej liczby, a dla dwóch - ich sumę. Na początek utwórzmy klasę `StringCalculator`.
 
```bash
$ bin/phpspec desc StringCalculator
```

Następnie sprawdźmy, czy test przejdzie. Pierwsze uruchomienie polecenia powinno wygenerować za nas odpowiednia klasę, która będzie spełniać warunki utworzonego testu.

```bash
$ bin/phpspec run
```

Ze specyfikacji zadania wiemy, że metoda `int add(string numbers)` może przyjąć jako argument pusty string, jedną liczbę lub dwie liczby i zwrócić ich sumę. Dla pustego stringu metoda powinna zwrócić wynik `0`. Na podstawie fragmentu specyfikacji, możemy opisać zachowanie klasy. Dodajmy metodę do testu (klasa `StringCalculatorSpec`):

```php
// Test
function it_returns_0_for_empty_string()
{
    $this->add("")->shouldReturn(0);
}
```

Wynik tego testu będzie negatywny. Metoda `add` jeszcze nie istnieje. *Spec* utworzy ją za nas, ale o implementację musimy już sami zadbać:
 
```php
// Implementacja
public function add($numbers)
{
    return 0;
}
```

Metoda `StringCalculator::add` w tym momencie robi dokładnie to, czego wymaga specyfikacja. Dołóżmy kalkulatorowi nowe zachowanie - jeśli prześlemy jedną liczbę, metoda niech zwróci jej wartość.

```php
// Test
function it_returns_1_for_1()
{
    $this->add("1")->shouldReturn(1);
}

// Implementacja
public function add($numbers)
{
    if (empty($numbers)) {
        return 0;
    }

    return (int)$numbers;
}
```

Nasza klasa radzi już sobie z pustym stringiem i jedną liczbą. Nauczmy ją dodawać dwie liczby:

```php
// Test
function it_returns_5_for_2_and_3()
{
    $this->add("2,3")->shouldReturn(5);
}

// Implementacja
public function add($numbers)
{
    // ...

    $numbers = explode(",", $numbers);
    return array_sum($numbers);
}
```

##### Zadanie 2.

Pierwszy punkt zadania za nami. Następną cechą jaką powinien wyróżniać się nasz kalkulator jest możliwość dodawania nieograniczonej liczby cyfr. Sprawdźmy to na kilku przypadkach:

```php
// Dokładaj po jednej metodzie do testu i sprawdź czy przechodzą
// Jeśli wynik jest negatywny, spraw by stał się pozytywny
function it_returns_6_for_1_and_2_and_3()
{
    $this->add("1,2,3")->shouldBe(6);
}

function it_returns_10_for_1_and_2_and_3_and_4()
{
    $this->add("1,2,3,4")->shouldBe(10);
}

function it_returns_15_for_1_and_2_and_3_and_4_and_5()
{
    $this->add("1,2,3,4,5")->shouldBe(15);
}
```

##### Zadanie 3.

Następną cechą kalkulatora powinna być możliwość dodawania liczb rozdzielonych znakiem nowej linii, a nie jak dotychczas tylko przecinkiem:

```php
// Test
function it_returns_6_for_1_new_line_and_2_and_3()
{
    $this->add("1\n2,3")->shouldBe(6);
}

// Implementacja
public function add($numbers)
{
    // ...

    $numbers = str_replace("\n", ",", $numbers);
    $numbers = /* ... */
    
    // ...
}
```


##### Zadanie 4.

Kolejną cechą kalkulatora jest możliwość zmiany znaku, który rozdziela dodawane liczby. Domyślnie jest to przecinek. Dane wejściowe definiujące nowy separator wyglądają nastepująco: `//[delimiter]\n[numbers...]`. 

**Wszystkie poprzednie scenariusze również muszą przechodzić.**

```php
// Test
function it_adds_numbers_with_different_delimeter()
{
    $this->add("//;\n1;2")->shouldBe(3);
    $this->add("//,\n3,4")->shouldBe(7);
    $this->add("//$\n5$6")->shouldBe(11);
}

// Implementacja
public function add($numbers)
{
    // ...

    $separator = ",";

    if (preg_match('#//(.*)\n(.*)#', $numbers, $matches)) {
        $separator = $matches[1];
        $numbers = $matches[2];
    }

    $numbers = str_replace("\n", $separator, $numbers);
    $numbers = explode($separator, $numbers);

    // ...
}
```

##### Zadanie 5.

Kalkulator nie potrafi dodawać liczb ujemnych. Musimy go przed tym zabezpieczyć. Jeśli wprowadzimy liczby ujemne, kalkulator powinien rzucić wyjątek wskazujący nieprawidłowe liczby.

```php
// Długa nazwa testu dokładnie opisuje pożądane zachowanie
function it_throws_an_exception_when_given_string_contains_negative_numbers()
{
    $exception = new \InvalidArgumentException('Negative numbers are not supported: -1, -3');

    $this->shouldThrow($exception)->duringAdd("-1,2,-3");
    $this->shouldThrow($exception)->duringAdd("//;\n-1,2,-3");
}

// Implementacja
public function add($numbers)
{
    // ...

    $negativeNumbers = [];

    foreach ($numbers as $number) {
        if ($number < 0) {
            $negativeNumbers[] = $number;
        }
    }

    if (!empty($negativeNumbers)) {
        $message = sprintf('Negative numbers are not supported: %s', implode(', ', $negativeNumbers));
        throw new \InvalidArgumentException($message);
    }
    
    // ...
}
```

W tym miejscu warto się zastanowić, czy możemy w jakiś sposób oddelegować część zadań do prywatnych metod. Nowo powstały kod w metodzie wydzieliłbym do prywatnej metody `validateInput(array $numbers)`, która zajęłaby się sprawdzaniem poprawności liczb. 

**Po każdym refaktoringu należy się upewnić, czy testy wciąż przechodzą!**

###### Zatrzymaj się, jeśli jesteś początkującym 

Jeśli powyższe cechy kalkulatora sprawiały Ci problem, potraktuj dodatkowe zadania jako ciekawostkę.

##### Zadanie 6.

Następnym zadaniem jest wbudowanie w kalkulator filtru, który będzie ignorował liczby większe od 1000.

```php
// Test
function it_ignores_numbers_bigger_than_1000()
{
    $this->add('2,1001')->shouldBe(2);
    $this->add('2,1000')->shouldBe(1002);
}

// Implementacja
// Dokładamy filtr, który musi wykonać się przed funkcją array_sum
public function add($numbers)
{
    // ...
    
    return array_sum(array_filter($numbers, function ($number) {
        return $number <= 1000;
    }));
}
```


##### Zadanie 7.

Zbliżamy się do końca. Kolejnym zadaniem jest możliwość zdefiniowania separatora o dowolnej długości znaków. 

```php
// Test
function it_adds_numbers_with_different_length_of_delimeter()
{
    $this->add("//[;;;]\n1;;;2")->shouldBe(3);
    $this->add("//[,,,]\n3,,,4")->shouldBe(7);
    $this->add("//[$$$]\n5$$$6")->shouldBe(11);
}


// Implementacja
public function add($numbers)
{
    // ...
    
    if (preg_match('#//(.|\[(.*)\])\n(.*)#', $numbers, $matches)) {
        $separator = $matches[2] ?: $matches[1];
        $numbers = $matches[3];
    }
    
    // ...
}
```

##### Zadanie 8.

Przedostatnim zadaniem jest możliwość zdefiniowania kilku separatorów w ramach pojedynczego zestawu wejściowego. Składnia wejścia jest następująca: `//[delim1][delim2]\n[numbers...]`.

```php
// Test
function it_adds_numbers_with_differents_delimeters()
{
    $this->add("//[*][%]\n1*2%3")shouldBe(6);
    $this->add("//[*][%][#]\n1*2%3#4")->shouldBe(10);
}

// Implementacja
public function add($numbers)
{
    // ...
    
    // Rozwiązanie działające, ale nie-za-ciekawe
    // TODO: Po ukończeniu całości wrócimy do tego miejsca
    if (preg_match('#//(.|\[([^\]]+)\])\n(.*)#', $numbers, $matches)) {
        $separator = $matches[2] ?: $matches[1];
        $numbers = $matches[3];
    } elseif (preg_match('#//(\[(.*)\]){1,}\n(.*)#', $numbers, $matches)) {
        $separator = explode('][', $matches[2]);
        $numbers = $matches[3];
    
        $numbers = str_replace($separator, ',', $numbers);
        $separator = ',';
    }
    
    // ...
}
```

##### Zadanie 9.

Ostatnim zadaniem jest możliwość definiowania separatorów dłuższych niż jeden znak. 

```php
// Test
function it_adds_numbers_with_differents_delimeters_and_unknown_length_of_delimeter()
{
    $this->add("//[*][%%]\n1*2%%3")->shouldBe(6);
    $this->add("//[*][%%][###]\n1*2%%3###4")->shouldBe(10);
}
```

W tym momencie posiadamy działający zgodnie ze specyfikacją kalkulator. Czy jestem zadowolony z kodu, który napisałem? Nie. Przedostatnie zadanie moim zdaniem jest najtrudniejsze i rozwiązanie do niego powinno być bardziej przejrzyste. Posiadam gotowy zestaw testów dla każdego punktu ze specyfikacji, dlatego mogę bez obaw refaktoryzować kod. Jeśli coś przestanie działać, moje testy to wykryją.

---

Gotowe rozwiązanie wraz z testami jest dostępne na Githubie - [https://github.com/pomek/tdd-string-calculator](https://github.com/pomek/tdd-string-calculator). Na wstępie zaznaczyłem, że miałem okazję rozwiązać to zadanie wcześniej. Udostępniłem w tym samym repozytorium poprzednie rozwiązanie. Pierwotnie [*poszedłem na skróty*]({% post_url 2015-07-21-masz-projekt-z-dlugiem-technologicznym %}) i nie naprawiłem błędów. Tym razem wyciągnąłem wnioski i kod dokładnie odzwierciedla wymogi specyfikacji.

#### Podsumowanie

W ramach podsumowania przedstawię kilka wniosków, które mi się nasunęły:

- pisz tyle kodu ile faktycznie potrzeba,
- nie twórz idealnych rozwiązań za pierwszym razem; najpierw zdaj test, później poprawiaj/ulepszaj,
- dbaj o jakość testów, od ich przejrzystości zależy *dokumentacja* klasy,
- spłacaj dług technologiczny możliwie jak najszybciej; czym później, tym bardziej nie będzie Ci się tego chciało poprawiać.
