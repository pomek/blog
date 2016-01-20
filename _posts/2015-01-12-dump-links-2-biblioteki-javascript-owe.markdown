---
title: >-
    Dump Links #2 - Biblioteki JavaScript-owe
layout: post
categories: Dump Links
comments: true
tags: javascript php oop laravel markdown regexp
identifier: dump-links-2-biblioteki-javascript-owe
---

W [poprzedniej częsci „Dump Links”]({% post_url 2014-11-26-dump-links-1-laravel-behat-phabricator-ddd %}) skupiłem się
na artykułach i linkach dotyczących języków po stronie serwera. Na dziś przygotowałem coś na temat narzędzi napisanych
w języku JavaScript. Zapraszam!

[**DeJavu**](http://indigounited.com/dejavu/) to narzędzie zorientowane obiektowo dla programistów JavaScript. 
To narzędzie udostepnia pełny interfejs obiektowy, który jest dostępny w innych językach programowania (takich jak Java 
czy PHP). DeJavu oferuje klasy (włącznie z abstrakcyjnymi, finalnymi), rozszrzanie klas, interfejsy, stałe oraz atrybuty 
widoczności.

Ktokolwiek musiał dostosować wygląd lub zachowanie aplikacji dla różnych przeglądarek, wie jak ciężkie jest to zadanie.
[**WhichBrowser**](https://github.com/WhichBrowser/Parser) może być pomocnym narzędziem. Ta biblioteka wykrywa przeglądarkę 
użytkownika (np Chrome), urządzenie (np Mobile), system operacyjny (np MacOS) oraz silnik przeglądarki (np Blink). 
Z tą biblioteką możesz dodać dowolne klasy dla dowolnych elementów HTML dla konkretnych użytkowników. Będzie to 
działać z różnymi środowiskami i różnymi przeglądarkami.

Probówałeś kiedyś stworzyć graf za pomocą HTML-a i CSS-a? Jeśli Twoja odpowiedź brzmi tak, doskonale wiesz jak skomplikowane
jest to zadanie. Powinieneś sprawdzić [**Mermaid**](https://github.com/knsv/mermaid). To narzędzie generuje 
[zaawansowane diagramy](http://knsv.github.io/mermaid/#mermaid) z różnymi instrukcjami zapisanymi za pomocą składni markdown. 
Dodatkowo pozwala na ulepszenie diagramów za pomocą CSS-a.

Czy kiedykolwiek przez pomyłkę wysłałeś jakieś e-maile z lokalnej maszyny (deweloperskiej) do użytkowników z produkcji?
Na nieszczęście my tak. Nie chcemy, by ten błąd powtórzył się ponownie. [**Napisałem prosty mechanizm**](https://github.com/DeSmart/laravel-mailer), 
który dba o to za nas. Za każdym razem gdy wysyłana jest wiadomość, mechanizm sprawdza, czy adres e-mail odbiorcy znajduje się 
na białej liście. Jeśli tak, e-mail zostanie wysłany. Jeśli nie, wiadomość zostanie przesłana na nasze konto. 
To umożliwia nam bezpieczne testowanie krytycznych funkcjonalności, takich jak newsletter z produkcyjną bazą danych.

Spotkałeś się kiedyś z problemem doboru kolorystyki do swojej aplikacji? Jeśli tak, definitywnie powinieneś sprawdzić
[**Coolors**](https://coolors.co/). To proste narzędzie służy do generowania palety z losowymi kolorami.

W [poprzednim poście]({% post_url 2014-11-26-dump-links-1-laravel-behat-phabricator-ddd %}) wspomniałem o Domain Driven Design w teorii. Kilka dni później znalazłem 
[**interesujący artykuł**](http://cocoders.com/cocoders-design-flow-specification-and-modelling-by-example/)
na temat praktycznego zastosowania DDD. To przykład aplikacji napisanej w Symfony, która również zawiera Behata.
[Źródło aplikacji](https://github.com/cocoders/playground/tree/modelling-by-example) jest dostępne na Githubie.

Jeśli nie masz pomysłu na nowy rok, możesz pograć w gry lub podszkolić swoje umiejętności w wyrażeniach regularnych
za pomocą [**krzyżówek zbudowanych z wyrażeń regularnych**](https://regexcrossword.com/).

Jeśli powyższy post nie usatysfakcjonował Twojego pragnienia wiedzy, polecam wybrać coś interesującego z listy 
[**TOP50 Code Post 2014**](http://code.tutsplus.com/articles/the-top-50-code-posts-of-2014--cms-22897). 
Jestem pewien, że znajdziesz coś interesującego dla siebie.

Nie bój się zostawić komentarza oraz podzielić się „Dump Links” z innymi. Do usłyszenia wkrótce!
