~~~
title: Czy ten moduł działa? Wstęp do testów integracyjnych
category: Software Development
comments: true
tags: 
    - integration tests
identifier: czy-ten-modul-dziala-wstep-do-testow-integracyjnych
created_at: 2016-02-15
~~~

[Testy jednostkowe](`@post po-co-mi-te-testy-jednostkowe.html`) *mówią*, że każda nasza pojedyncza klasa działa.
Czy jednak jest to wystarczająca gwarancja, aby stwierdzić, że moduł po spięciu kilku klas będzie działać? **Nie**.
Tę gwarancję ma zapewnić warstwa **testów integracyjnych**, która jest następną warstwą testowania automatycznego - zaraz po testach jednostkowych.

# Słowem wstępu

W zespołach deweloperów pojedyncze klasy często powstają równolegle na podstawie wcześniej zaplanowanego harmonogramu. 
Każdy z tych elementów będzie działał w określony sposób, który sprawdzą testy jednostkowe. Testy integracyjne - jak 
sama nazwa wskazuje - testują **integralność** systemu. Ich zadaniem jest wykrycie błędów w interfejsach pomiędzy klasami, 
jak również sprawdzenie interakcji kilku komponentów jednocześnie. 

Czym różnią się testy integracyjne od jednostkowych?

- testami integracyjnymi pokrywa się wrażliwe *(zdaniem programisty)* moduły - **nie wszystkie przypadki użycia aplikacji zostaną pokryte** testami,
- **testów integracyjnych jest o mniej od testów jednostkowych**,
- testy integracyjne **mogą wykonywać się nawet kilka sekund** przez zewnętrzne zależności,
- testy integracyjne mogą wskazać **błędy w kilku miejscach**,
- testy integracyjne **mogą być zależne od konfiguracji** bądź stanu, np schematu bazy i danych w niej umieszczonych,
- testy integracyjne **testują cały proces**.

# Powolne zależności 

Testy integracyjne mogą być powiązane z zewnętrznymi zależnościami, takimi jak baza danych, zewnętrzne API, system plików, etc.
Z tego powodu są one powolne i posiadanie ich zbyt wiele, może wydłużyć czas ich działania z kilku sekund, nawet do kilku minut.
W związku z tym, powinno się posiadać tyle testów integracyjnych, ile jest to niezbędne. W różnych zespołach ilość testów
będzie różna. Jednym wystarczą testy sprawdzające poprawne podpięcie zależności, innym będą potrzebne testy w oparciu
o bazę danych, jeszcze inne zespoły będą testować wszystkie warianty zewnętrznego API, które może *działać w kratkę*, a 
innej alternatywy dla niego nie ma.

Zbyt długie wykonywanie się testów może być przyczyną nietworzenia nowych testów. W jaki rozwiązać ten problem? 
Przedstawię kilka sprytnych sposobów, które mogą okazać się pomocne.

## Zewnętrzne API

Biblioteki, które łączą się z innym serwisem w celu pobrania danych są powolne, a przy okazji nie zawsze będą działać tak, 
jakbyśmy się tego spodziewali. Nie jesteśmy w stanie przewidzieć kiedy pechowy serwis zwróci nam białą stronę z komunikatem
`500 Internal Server Error`. W takiej sytuacji testy nie będą przechodzić, a my nic na to nie poradzimy.  

Zewnętrzne API możemy udekorować swoją klasą, która będzie implementować jakiś interfejs. Na potrzeby testów możemy stworzyć
*mocka* dla tego API, które również zaimplementuje wcześniej stworzony interfejs. W ten sposób nasz *mock* będzie zachowywał się
jak prawdziwe API, a jednocześnie będzie kilkukrotnie szybsze. 

*Na temat wzorca „Dekorator” możesz poczytać na [Wikipedii](https://pl.wikipedia.org/wiki/Dekorator_(wzorzec_projektowy)).* 

## Bazy danych

Kolejnym wąskim gardłem testów integracyjnych jest baza danych. Największym z mojej perspektywy problemem z bazami jest
utrzymanie ich stanu, który będzie tożsamy z bazami deweloperskimi. Mam tutaj na myśli strukturę tabel oraz dane w nich umieszczone.

Nasze repozytoria nie muszą w czasie testu *rozmawiać* z zewnętrzną bazą. Możemy w tym celu wykorzystać pamięć podręczną
uruchomionego skryptu. 

Załóżmy, że zdefiniowaliśmy interfejs o nazwie `UsersRepository`, który docelowo będziemy chcieli spiąć z jakąś bazą danych
lub zewnętrznym API. Na potrzeby testów możemy stworzyć *lokalne* repozytorium o nazwie `InMemoryUsersRepository`, które 
wszystkie rekordy będzie przechowywać w tablicy. 

**Interfejs zapewnia nam dokładnie takie samo zachowanie** jak w przypadku repozytorium działającego z bazą danych. 
W tym momencie interesują nas zwracane obiekty przez to repozytorium, a nie *storage*, skąd informacje będą pobierane.

Przy takim podejściu: 

- nie musimy dbać o poprawny schemat tabel w bazie,
- nie tracimy czasu na połączenie z bazą czy komunikację z API,
- nie musimy manualnie cofać wprowadzonych zmian.

## System plików

Podobnie jak z bazami danych, nasz *file system* również możemy *zmockować*. Poprawne działanie konkretnej implementacji
zapewniają testy jednostkowe użytego obiektu. W testach integracyjnych możemy użyć klasy, która - podobnie jak w przypadku
`InMemoryUsersRepository` - będzie operować na pamięci lokalnej.

# Testowanie procesu

Bardzo często testy integracyjne są tworzone metodą **białej skrzynki**. Oznacza to, że wymagana jest znajomość struktury 
aplikacji, co pomaga zdefiniować rodzaj danych wejściowych i wyjściowych. Drugą zaletą tej metody jest szansa na znalezienie 
fragmentu kodu, który może zostać zoptymalizowany podczas implementacji testów.

Aby przetestować zachowanie modułu, musimy zdefiniować określony scenariusz, według którego będa uruchamiane
poszczególne sekwencje kodu. W ramach takiego scenariusza powinniśmy podać kilka informacji:

* **tło scenariusza**, czyli co jest dostępne w systemie,
* **założenia**, które dotyczą testowanego przypadku,
* **kroki scenariusza**, czyli co aktualnie robimy,
* **oczekiwania**, czyli jak po naszych zmianach, zachowa się system, bazując na przyjętych założeniach.

Podobnie jak w przypadku testów jednostkowych, sugeruję sprawdzenie wszystkich możliwych sytuacji. Przetestowanie
tylko zielonej ścieżki może w przyszłości odbić się nieoczekiwanym błędem systemu.

# Zalety testów integracyjnych

Podobnie jak w przypadku testów jednostkowych, testy integracyjne również mają swoje zalety:

* **wykrywają regresję**, która na poziomie nieumiejętnie napisanych testów jednostkowych może nie wystąpić,
* **gwarantują poprawną komunikację** pomiędzy klasami oraz modułami,
* **testują *większy fragment* systemu**, dzięki czemu z całą pewnością możemy stwierdzić, że „to działa tak, jak chcę aby działało”,
* odpowiednio **zoptymalizowane** testy mogą być równie szybkie jak testy jednostkowe,
* są żywą **dokumentacją całego modułu**; **Behavior-driven development** będzie tematem kolejnego artykułu.

# Złe praktyki

Czyli czego unikać, aby test integracyjnym pozostał testem integracyjnym:

* **unikaj logiki w testach** - test integracyjny to w dalszym ciągu test, a testy nie powinny być skomplikowane,
* **dbaj o jego jakość** - dokumentacja modułu będzie tak czytelna jak czytelny jest kod testu integracyjnego - test to nie kod drugiej kategorii,
* **nie testuj zachowania pojedynczej klasy** - od tego są testy jednostkowe,
* **ograniczaj do minimum wolne zależności**, test integracyjny również może być szybki,
* **nie uruchamiaj testów integracyjnych jeśli testy jednostkowe nie przechodzą**, jest duże prawdopodobieństwo, że te testy też nie przejdą.

# Podsumowanie

Jak wspomniałem wcześniej, ilość testów integracyjnych w różnych zespołach będzie różna. Ich objętość będzie zależała
od doświadczenia zespołu, skomplikowania systemu oraz dostępnego czasu na ich napisanie. Z doświadczenia wiem, że warto
pokryć testami krytyczne funkcjonalności w naszej aplikacji, które wydają się problematyczne i ich rozwój w przyszłości
do najłatwiejszych należeć nie będzie.

Przedstawiłem *trochę* teorii na temat testów integracyjnych. W następnym poście poruszę ten sam temat od strony praktycznej.
Stworzę fragment abstrakcyjnego systemu, który od początku do końca będzie powstawał zgodnie z metodyką **Behavior-driven development**.
Wyjaśnieniem tego terminu również zajmę się w przyszłym artykule.
