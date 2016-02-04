---
title: >-
    String Calculator i pierwszy kontakt z TDD
layout: post
categories: PHP
comments: true
tags: unit tests php tdd
identifier: string-calculator-i-pierwszy-kontakt-z-tdd
---

Niedawno napisałem artykuł na temat [testów jednostkowych]({% post_url 2016-02-01-po-co-mi-te-testy-jednostkowe %}), który mocno skupił się na teorii. Nie pokazałem żadnych 
narzędzi ani sposobów jak takie testy pisać. W tym artykule rozwiążę krótkie ćwiczenie (*Code Kata*) 
zgodnie z metodyką **TDD**. Jako ciekawostkę dodam, swój pierwszy kontakt z **TDD** jak i testami, również doświadczyłem z tym zadaniem.

Słowem krótkiego wstępu, czym jest wyżej wspomniane *Code Kata*? **Kata** to słowo pochodzenia japońskiego, które oznacza
pewien rodzaj ćwiczeń. Natomiast **Code Kata** to ćwiczenia programistyczne, które mają na celu pomóc programiście ulepszyć swoje umiejętności.

---

Tematem dzisiejszego artykułu będzie ćwiczenie [**„String Calculator”**](http://osherove.com/tdd-kata-1/). Zanim jednak zaczniemy,
potrzebujemy kilku narzędzi oraz reguł, które musimy przestrzegać:

* *zainstaluj (i zapoznaj się)* [**PHPSpec**](http://phpspec.readthedocs.org/en/latest/) w miejscu, gdzie będziesz rozwiązywał zadanie; *PHPSpec* to biblioteka pozwalająca opisywać zachowanie klas w PHP,
* rozwiązuj zadania zgodnie z zasadą [*Red-Green-Refactor*](http://www.jamesshore.com/Blog/Red-Green-Refactor.html),
* nie czytaj treści całego zadania przed rozpoczęciem rozwiązywania,
* rozwiązuj tylko jeden punkt zadania w tym samym czasie; celem jest nauka pracy inkrementalnej, stopniowej,
* pamiętaj żeby testować tylko **prawidłowe dane wejściowe**; to są ćwiczenia i nieprawidłowy *input* nas nie interesuje.

#### String Calculator

Utwórz klasę `StringCalculator`, która będzie zawierała metodę `int add(string numbers)`. Pamiętajmy, żeby najpierw utworzyć test (*red*), a następnie implementację (*green*).
 
{% highlight bash %}
$ bin/phpspec desc StringCalculator
{% endhighlight %}

Następnie sprawdźmy, czy ten test przejdzie. Pierwsze uruchomienie polecenia powinno wygenerować za nas odpowiednia klasę, która będzie spełniać warunki utworzonego testu.

{% highlight bash %}
$ bin/phpspec run
{% endhighlight %}

Wspomniana wyżej metoda `int add(string numbers)` może przyjąć jako argument pusty string, jedną liczbę lub dwie liczby i zwrócić ich sumę. Dla pustego stringu metoda powinna zwrócić wynik `0`.
Zatem skoro znamy już fragment specyfikacji, możemy opisać zachowanie metody (klasa `StringCalculatorSpec`). Dodajmy zatem drugą metodę do testu:

{% highlight php %}
<?php
function it_returns_0_for_empty_string()
{
    $this->add("")->shouldReturn(0);
}
{% endhighlight %}

Wynik tego testu będzie negatywny. Metoda `add` jeszcze nie istnieje. *Spec* utworzy ją za nas, ale o implementację musimy już sami zadbać:
 
{% highlight php %}
<?php
public function add($numbers)
{
    return 0;
}
{% endhighlight %}

Dzięki tej prostej implementacji, nasza klasa robi dokładnie to, co powinna. 

Dołóżmy naszej klasie nowe zachowanie - jeśli prześlemy jedną liczbę, metoda niech zwróci jej wartość. Na początek test:

{% highlight php %}
<?php
function it_returns_1_for_1()
{
    $this->add("1")->shouldReturn(1);
}
{% endhighlight %}

Wynik testu będzie negatywny, nasza implementacja zawsze zwraca 0. Czas to zmienić:

{% highlight php %}
<?php
public function add($numbers)
{
    if (empty($numbers)) {
        return 0;
    }

    return (int)$numbers;
}
{% endhighlight %}

Nasza klasa radzi już sobie z pustym stringiem i jedną liczbą. Nauczmy ją dodawać dwie liczby:

{% highlight php %}
<?php
// Test
function it_returns_5_for_2_and_3()
{
    $this->add("2,3")->shouldReturn(5);
}

// Implementacja
public function add($numbers)
{
    if (empty($numbers)) {
        return 0;
    }

    $numbers = explode(",", $numbers);

    return array_sum($numbers);
}
{% endhighlight %}

Jeśli nie jesteśmy pewni swojego rozwiązania, dołóżmy drugi test, który potwierdzi nam, czy nasz kalkulator poprawnie dodaje dwie liczby:

{% highlight php %}
<?php
// Prawdopodobnie ten test przejdzie
function it_returns_9_for_5_and_4()
{
    $this->add("5,4")->shouldReturn(9);
}
{% endhighlight %}

Pierwszy punkt zadania za nami. Następną cechą jaką powinien wyróżniać się nasz kalkulator jest możliwość dodawania nieograniczonej liczby cyfr. Sprawdźmy to na kilku przypadkach:

{% highlight php %}
<?php
// Dokładaj po jednej metodzie do Specki i sprawdź czy przechodzą
// Jeśli wynik jest negatywny, spraw by stał się pozytywny
function it_returns_10_for_1_and_2_and_3()
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
{% endhighlight %}

Następną cechą kalkulatora powinna być możliwość dodawania liczb rozdzielonych znakiem nowej linii, a nie jak dotychczas tylko przecinkiem:

{% highlight php %}
<?php
function it_returns_6_for_1_new_line_and_2_and_3()
{
    $this->add("1\n2,3")->shouldBe(6);
}
{% endhighlight %}

Pamiętajmy, że implementacja powinna być tak prosta, aby test nie sypał błędami.

{% highlight php %}
<?php
public function add($numbers)
{
    if (empty($numbers)) {
        return 0;
    }

    // Zamieniamy nowe linie na "działający" seperator
    $numbers = str_replace("\n", ",", $numbers);
    $numbers = explode(",", $numbers);

    return array_sum($numbers);
}
{% endhighlight %}
