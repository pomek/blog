---
title: >-
    Po co mi te testy jednostkowe?
layout: post
categories: Software Development
comments: true
tags: unit tests ci
identifier: po-co-mi-te-testy-jednostkowe
---

Deweloperzy, którzy jeszcze nie doświadczyli kontaktu z testami jednostkowymi, nie wiedzą jak wiele tracą i jak bardzo
utrudniają sobie tworzenie aplikacji. 
Testy jednostkowe to fundament [**testów automatycznych**](https://watirmelon.files.wordpress.com/2012/01/idealautomatedtestingpyramid.png),
który aplikacja powinna posiadać. Automatyczny proces testowania pozwala zautomatyzować proces 
aktualizowania produkcji, a to zmniejsza ryzyko wystąpienia błędu. Jednak zanim dojdziemy do automatycznych
aktualizacji, najpierw musimy przejść przez pierwszy etap - **testy jednostkowe**.

##### Czym właściwie są testy jednostkowe?

Testy jednostkowe to nic innego jak kod, który wykonuje się w kontrolowanych warunkach. Celem tego kodu jest weryfikacja,
czy dostarczone przez nas dane wejściowe (*input*), po przejściu przez kod, dają taki rezultat, jakiego oczekujemy (*output*).

Czy to jedyna zaleta z posiadania testów jednostkowych? Nie.

##### Architektura aplikacji

Testy jednostkowe połączone z metodyką [**TDD**](https://en.wikipedia.org/wiki/Test-driven_development) 
wymuszają na programiście chwilę refleksji. Przed rozpoczęciem *kodzenia*, programista ma okazję przemyśleć,
czy jego pomysł ma sens, czy ten pomysł może być przetestowany, gdzie powinien być interfejs, jakie powinny być zależności, etc.
Ogólnie chwila refleksji pozwala odpowiedzieć na pytanie - *„czy wybrany sposób realizuje faktyczne zapotrzebowanie na kod”*.

Jeśli nie potrafimy napisać testu do kodu, to prawdopodobnie mamy problem z architekturą naszej aplikacji.

#### Czy mój kod działa?

Programiści, którzy nie posiadają testów jednostkowych, na to pytanie odpowiedzi nie znają. Mogą zakładać, że skoro 
parser nie zwraca błędów, to ich kod będzie działać. Czy jednak brak błędów parsowania jest wyznacznikiem działania kodu? Nie.

Testy jednostkowe pozwalają jednoznacznie stwierdzić, czy napisany przez nas kod działa. Ten sam test (bez żadnych zmian), uruchomiony ponownie
powinien zwrócić dokładnie ten sam rezultat co poprzednio.

Dzięki testom, odpowiedź na pytanie *„Czy mój kod działa?”* jest prosta - jeśli testy przechodzą, to i kod działa.

#### Regresja

Dzięki **dobrym** testom jesteśmy zabezpieczeni przed regresją. Ciężko jest mi opisać czym charakteryzuje się „dobry test”, ale możemy wyróżnić kilka punktów:

- **szybkość** - testy powinny być możliwie jak najszybsze,
- **nazewnictwo** - nazwy testów powinny określać jakie przypadki testujemy,
- **izolacja** - testy nie powinny od siebie zależeć; żaden test nie powinien uruchamiać innego testu,
- **jednoznaczność** - test jednoznacznie informuje o rezultacie (albo czerwony, albo zielony),
- **powtarzalność** - testy powinny dawać ten sam rezultat za każdym razem kiedy są uruchamiane,
- **asersja** - każdy test powinien mieć co najmniej jedną asercję,
- **pojedyncza odpowiedzialność** - jeden przypadek testowy powinien testować jedną pełną ścieżkę programu,
- **niezależność** - wszystkie zależności powinny być zastąpione obiektami [*test doubles*](https://en.wikipedia.org/wiki/Test_double); w ten sposób implementacje zależności nie wpływają na wynik testu.

W kontekście **TDD** istnieje zasada [**FIRST**](https://github.com/ghsukumar/SFDC_Best_Practices/wiki/F.I.R.S.T-Principles-of-Unit-Testing),
która pokrywa się z powyższymi punktami.

#### Dokumentacja

Testy jednostkowe mogą być traktowane jako **żyjąca dokumentacja** kodu, ponieważ testy:
 
- są **czytelne dla programisty**,
- są **zsynchronizowane** z kodem, bo inaczej by nie przechodziły,
- wyjaśniają **zamiary** autora, które można tymi testami zweryfikować.

Każda aktualizacja testów wymusza poprawienie kodu, a co za tym idziem *dokumentacja* również ulega zmianom.
 
#### Złe praktyki  

Jak wspomniałem na początku artykułu, testy jednostkowe to nic innego jak kod. Źle napisany test może stwarzać więcej problemów
niż jego brak. Podobnie jak w przypadku „dobrych testów”, możemy wyróżnić kilka cech „testów złych”:

- **testowanie „geterów/seterów”** - unika się testowania metod, których jedynym zadaniem jest zwrócenie wartości bądź zmiana wartości atrybutu,
- **testowanie prywatnych metod** - nie powinno się testować prywatnych metod, ponieważ nie interesuje nas wewnętrzna komunikacja w obiekcie, a jedynie ich publiczne API,
- **testowanie wyjątków** - określ dokładnie w którym miejscu i jakiego typu wyjątku się spodziewasz; nie bazuj na bazowym `Exception`, a doprecyzuj możliwie jak się da klasę z wyjątkiem,
- **testowanie napisanego już kodu** - napisany kod prawdopodobnie działa, napisanie testów do tego kodu tylko po to, aby uzyskać *zielony pasek*, nic nie zmieni; testy do gotowego kodu powinny zostać napisane przed zmianami w tym kodzie,
- **konfigurowanie testów** - testy nie powinny zawierać konfiguracji,
- **testy tylko pozytywnej ścieżki** - test nie powinien skupiać się tylko na pozytywnej ścieżce; powinien również sprawdzić warunki brzegowe,
- **logika w teście** - testy nie powinny być skomplikowane, czyli nie powinny mieć w sobie pętli i instrukcji warunkowych; nie chcemy pisać testów do testów, prawda?

#### Podsumowanie

Jeśli jeszcze nie doświadczyłeś przyjemności z pisania testów jednostkowych, mam nadzieję, że po przeczytaniu tego artykułu Twoje nastawienie się zmieni i testy zaczną być fundamentem w Twojej codziennej pracy.
 
Na wstępie wspomniałem o testach automatycznych i piramidzie testów. Z całą pewnością mogę stwierdzić, że na jednym artykule o testach się nie skończy.

Chciałbyś coś dodać, podzielić się swoim doświadczeniem? Komentarze są do tego odpowiednim miejscem.
