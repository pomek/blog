---
title: >-
    Masz projekt z długiem technologicznym?
layout: post
categories: 
    - Software Development
comments: true
tags:
    - technical debt
    - refactoring
    - automatic tests
    - unit tests
    - PHP
identifier: masz-projekt-z-dlugiem-technologicznym
---

Każdy projekt powstaje w różnych warunkach i od samego początku jest on obarczony pewnymi problemami. W idealnym świecie, mamy wpływ na nasz projekt. Niestety, idealne sytuacje nie istnieją, więc nie możemy wszystkiego kontrolować i od momentu rozpoczęcia prac jesteśmy narażeni na zaciągnięcie długu technologicznego.

Najczęściej występującym problemem w każdym projekcie jest deadline. Pod presją czasu tworzymy zły kod, który nie jest kompatybilny z *dialogiem* [**SOLID**](https://scotch.io/bar-talk/s-o-l-i-d-the-first-five-principles-of-object-oriented-design) bądź co gorsze, kod ten nie jest pokryty żadnymi testami jednostkowymi.

Czym właściwie jest **dług technologiczny**? Każde *pójście na skróty* bądź omijanie problemów za pomocą różnych *hacków* generuje dług technologiczny. Wielu programistów, z różnych powodów, celowo zaciąga dług z nadzieją, że w przyszłości go "spłaci". Niestety, na nadziei się kończy.

Chciałbym się podzielić historią, która ostatnio zdarzyła się w naszym projekcie. Jedna z podstawowych funkcjonalności w naszym projekcie to mechanizm wyszukiwania. Na początku mieliśmy aż 3 kryteria (filtry), za pomocą których można było ustawić parametry wyszukiwania. Pamiętając, że tworzymy wersję [**MVP**](https://en.wikipedia.org/wiki/Minimum_viable_product), nie martwiliśmy się problemem, który (*jeszcze*) nie istniał. Nasz początkowy kod wyglądał mniej więcej tak:

```php
namespace Search;

class SearchQueryParams
{
    // ...
    
    public function getLocation()
    {
        return $this->location;
    }
    
    public function getPeople()
    {
        return $this->people;
    }
    
    public function getEventTypeId()
    {
        return $this->eventTypeId;
    }
    
    // ...
}

namespace Search\Repository;    

class SearchRepository
{
    // ...
        
    public function getRoomsByCriteria(SearchQueryParams $params)
    {
        // ...
        
        if (null !== $params->getLocation()) {
            $query->where('location', $params->getLocation());
        }
        
        if (null !== $params->getEventTypeId()) {
            $query->where('event_type_id', $params->getEventTypeId());
        }
        
        if (null !== $params->getPeople()) {
            $query->where('capacity', $params->getPeople());
        }
        
        // ...
    }
        
    // ...
}
```

**Początkowo** powyższy kod nie był problemem. Wszystkie dostępne filtry były umieszczone w jednym miejscu i każdy z deweloperów wiedział jak to działa.

Wraz z kolejnymi etapami projektu, mechanizm wyszukiwania zaczął się rozrastać. Oprócz poprzednich filtrów, dodaliśmy kolejne, które były bardziej skomplikowane niż te początkowe. W związku z rozwojem wyszukiwarki, metoda `getRoomsByCriteria` stała się bardzo obszerna. Część naszego kodu z repozytorium została przeniesiona do modelów - skorzystaliśmy z możliwości wydzielania tych samych zapytań do [Laravel-owych scope'ów](https://laravel.com/docs/5.1/eloquent#query-scopes). Wciąż mogliśmy filtrować wyniki wyszukiwania oraz wykorzystywać zaawansowane fragmenty zapytań w kilku miejscach (lubimy [zasadę **DRY**](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself)).

Nie zauważyliśmy jednak momentu, kiedy nasza wyszukiwarka miała już **10 filtrów** i **jej kod został rozmieszczony w różnych miejscach** w aplikacji:

* Kontroler **budował** obiekt z parametrami wyszukiwania `SearchQueryParams`,
* Kontroler **obsługiwał** formularz z filtrami wyszukiwania,
* Kontroler **pobierał** dane i przekazywał je do widoku.

Jak możemy zauważyć, **nasz kontroler robił wszystko**. Zdaliśmy sobie sprawę, że w pewnym momencie popełniliśmy błąd, który nazywamy **długiem technologicznym** i dodanie nowych filtrów do tej wyszukiwarki mogło by być niezłym wyzwaniem.

Nasza aplikacja posiadała zestaw automatycznych testów, które pomogły nam wykryć regresję w każdym z dostępnych filtrów. Z solidnym fundamentem w postaci tych testów, zdecydowaliśmy się na przepisanie silnika wyszukiwania.

### Refaktoring? Jak?

Przed rozpoczęciem refaktoringu, **klient został poinformowany** o aktualnej sytuacji. **Wytłumaczyliśmy** dlaczego zarządzanie tym modułem w przyszłości może być utrudnione oraz dlaczego warto poświęcić kilka dni na refaktoring teraz, niż w przyszłości tracić te dni na zrozumienie co właściwie w tym kodzie się dzieje. Ostatecznie, **dostaliśmy zielone światło na naprawę**.

Nasz refaktoring rozpoczęliśmy od krótkiego spotkania, na którym **zaplanowaliśmy** podstawy wszyskich filtrów i kryteriów wyszukiwania. Następnie wspólnie ustaliliśmy jak nowy silnik powinien wyglądać. Każdy z dostępnych filtrów powinien mieć dedykowaną klasę, która dodaje niezbędne warunki do finalnego zapytania.

![Rezultat krótkiego spotkania, na którym powstały definicje filtrów do wyszukiwarki.](/images/masz-projekt-z-dlugiem-technologicznym/search-filters.jpg)

Repozytorium `SearchRepository` zostało wyposażone w nowy interfejs, który pozwalał dodawanie w przyszłości warunków (kryteriów) do zapytania:

```php
namespace Search\Repository;

use Search\Criteria\CriterionInterface;

interface RepositoryWithCriteriaInterface
{
    /**
     * Add new criterion into query.
     *
     * @param \Search\Criteria\CriterionInterface $criterion
     * @return self
     */
    public function pushCriterion(CriterionInterface criterion);

    /**
     * Apply all given criteria into current query.
     *
     * @return self
     */
    public function applyCriteria();
}
```

Każde kryterium implementowało również interfejs, który umożliwiał dodanie filtrów do repozytorium:

```php
namespace Search\Criteria;

use Illuminate\Database\Eloquent\Builder;

interface CriterionInterface
{
    /**
     * Apply the criterion into query
     *
     * @param \Illuminate\Database\Eloquent\Builder
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function apply(Builder $model);
}
```

Przykład konkretnego kryterium, którego zadaniem jest sprawdzić, czy wyniki wyszukiwania znajdują się we wskazanej lokalizacji:

```php
namespace Search\Criteria; 

use Illuminate\Database\Eloquent\Builder;

class VenueIsInGivenLocation implements CriterionInterface
{
    /**
     * @var string
     */
    private $location;

    public function __construct($location)
    {
        $this->location = $location;
    }

    /**
     * Apply the criterion into query
     *
     * @param \Illuminate\Database\Eloquent\Builder
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function apply(Builder $model)
    {
        if (true === empty($this->location)) {
            return $model;
        }

        return $model->where('venues.city', $this->location);
    }
}
```

Tworzenie filtrów było najprostszym krokiem w refaktoringu. Powstała dedykowana fabryka, której zadaniem było budowanie obiektów z kryteriami. Napisane testy jednostkowe gwarantowały, że ten etap w procesie działa prawidłowo - **zgodnie z naszymi oczekiwaniami**.

Pozostał jeszcze kontroler, który wciąż robił za dużo. Jego odpowiedzialność również podzieliliśmy na dwie, mniejsze fabryki: pierwsza tworzyła obiekt `SearchQueryParams` bazując na aktualnym żądaniu (*request*), druga bazując na utworzonym wcześniej obiekcie, budowała formularz z uzupełnionymi filtrami. W rezultacie, każda z fabryk również może mieć dedykowany zestaw testów jednostkowych. Napisałem *„może mieć”*, ponieważ spędziłem wiele czasu na implementowanie pozostałych części i niestety nie miałem więcej czasu na przetestowanie tych fabryk.

Kiedy **silnik zaczął działać tak**, jak się tego spodziewaliśmy, **ostatnim krokiem w refaktoringu było posprzątanie starych miejsc ze złym kodem** i zastąpienie ich nowym tworem.

Zmodyfikowany silnik zawsze tworzył kompletny zestaw filtrów. Przed zmodyfikowaniem zapytania, każdy z filtrów sprawdzał, czy posiada poprawne parametry. Jeśli nie, filtr był ignorowany.

```php
/**
 * Builds the search criterion based on Search Query Params.
 *
 * @param \Search\SearchQueryParams $params
 * @return void
 */
protected function buildSearchFilters(SearchQueryParams $params)
{
    // ...
    
    $this->criteria[] = $this->criterionFactory->createRoomCanHostEventOfTypeCriteria($params->getEventTypeId());
    $this->criteria[] = $this->criterionFactory->createRoomHasFeaturesCriteria($params->getRoomFeatureIds());
    $this->criteria[] = $this->criterionFactory->createVenueHasCateringOptionCriteria($params->getCateringOptionIds());
    $this->criteria[] = $this->criterionFactory->createRoomHasEnoughCapacityCriteria($params->getPeople());
    $this->criteria[] = $this->criterionFactory->createRoomHasPriceOfARangeCriteria($params->getPriceRangeIds());
    $this->criteria[] = $this->criterionFactory->createRoomHasStyleCriteria($params->getRoomStyleIds());

    // ...
}
```

Z refaktoringiem byliśmy w stanie pozbyć się długu technologicznego, który w przyszłości mógłby zastopować prace nad projektem. Ponadto wyróżniliśmy dodatkowe zalety:

* **Kontroler tylko akceptował żądania i zwracał odpowiedzi**,
* Powstała dedykowana fabryka do budowania obiektu `SearchQueryParams`,
* Powstała dedykowana fabryka do budowania formularza wyszukiwarki,

Skąd pomysł na tego typu refaktoring? Inspirowałem się artykułem [„Using Repository Pattern in Laravel&nbsp;5”](https://bosnadev.com/2015/03/07/using-repository-pattern-in-laravel-5/) autorstwa [Mirza Pasic](https://twitter.com/b1rkh0ff).

#### Aktualizacja

Wiem, że w powyższym kodzie popełniłem błąd. Repozytorium powinno być traktowane jako kolekcja (nie powinno zawierać stanu). Tak więc, `SearchRepository` nie powinno zawierać właściwości `$criteria`. Metody `applyCriteria` oraz `pushCriterion` powinny zostać usunięte. W rezultacie, metoda `getItems` wymaga tylko jednego parametru - `CriteriaCollection` - kolekcji, która zawiera utworzone kryteria. 

W powyższym rozwiązaniu kryteria były budowane i dołączane do `SearchRepository`. Teraz kryteria są dołączane do kolekcji (`CriteriaCollection`). Bazując na tej kolekcji, mogę pobrać konkretne wyniki.

```php
/**
 * Builds the search criterion based on Search Query Params.
 *
 * @param \Search\SearchQueryParams $params
 * @return void
 */
protected function buildSearchFilters(SearchQueryParams $params)
{
    // ...
    
    $this->collection->add(
        $this->criterionFactory->createRoomCanHostEventOfTypeCriteria($params->getEventTypeId())
    );

    $this->collection->add(
        $this->criterionFactory->createVenueHasCateringOptionCriteria($params->getCateringOptionIds())
    );

    $this->collection->add(
        $this->criterionFactory->createRoomHasEnoughCapacityCriteria($params->getPeople())
    );
    
    // ...
}
```

Natomiast metoda `SearchRepository::getItems()` wygląda następująco:

```php
/**
 * @param \Search\Criteria\CriteriaCollection collection
 * @return array
 */
public function getItems(CriteriaCollection $collection)
{
    // ...
    
    foreach ($collection->getAll() as $item) {
        $item->apply($query);
    }
                
    // ...
}
```
