---
title: >-
    Masz projekt z długiem technologicznym? Czas na refaktoring!   
layout: post
categories: Software Development
comments: true
identifier: masz-projekt-z-dlugiem-technologicznym-czas-na-refaktoring
---

Each project is created in different conditions and from the beginning it is burdened with some problems. Ideally, from the very beginning to the end only we would have an impact on our project. Unfortunately, ideal situations don't exist. We can't control everything and from the outset we work under pressure.

The most common problem in the project is the deadline. Because of it we created bad code which is incompatible with the SOLID rules. Often we don't have unit tests and the worst thing is that after some time, we don't remember what we created.

What exactly is the technical debt? When we are creating an application, we are using some hacks, we are taking shortcuts and in result we create a technical debt.

I would like to share the story of what recently occurred in our project. One of the basic functionalities in our project is the search engine. At the beginning we had only three criteria (filters) to search. Bearing in mind that we created a MVP version without worrying about problems that didn’t exist, our initial code looked something like this:

{% highlight php linenos %}
<?php
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
{% endhighlight %}

Initially, this code did not cause any problems. All available filters were in one place and everyone knew how they worked.

Along with the successive stages of the project, the search engine started to grow. Besides the previous filters, we have added others which were more sophisticated than the first three. In connection to the expansion of the search, the method getRoomsByCriteria has become very expanded. Part of the code from the repository moved to the model, using Laravel scopes mechanism. We could still filter results, and take advantage of a fragment of the same query several times (we like the DRY principle) in other places.

We did not notice the moment when our search engine had ten filters and its code was split in different places in the application:

- Controller built object with params to search (SearchQueryParams),
- Controller handled form with the search filters,
- Controller called method in repository and forwarded data to view.

As we can observe, our controller did everything. We realized that at some point we made a mistake that is called a technological debt and any further attempts to add a new filter or modify an existing one can be a critical task.

Our application has a set of automated tests that helped detect regression in each of the available filters. With a solid base in the form of these tests, we decided that we need to rewrite our search engine.

### Refactoring? How?
Before we started refactoring, first the customer was informed about the current situation. We told him about the mess that we have created in the search engine. We explained that maintaining this functionality in the future may be difficult and that it is worth spending a few days now on refactoring, so that in the future nobody will have to lose a few days and try to understand why it has been written this way. The customer agreed with us that we need to refactor our code.

Our refactoring started with a short meeting where we made plans on the basis of all of our filters and search criteria. Then, together we determined how the new search engine should look like. Each of the available filters should have a dedicated class that adds the necessary conditions to the query.

Repository SearchRepository was equipped with a new interface which allows adding further conditions (criteria) to the query:

{% highlight php linenos %}
<?php
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
{% endhighlight %}

Specific criteria also implemented the interface, so the criteria could be added to the repository:

{% highlight php linenos %}
<?php
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
{% endhighlight %}

An example of a specific criterion which checks to see if our results are at a specific location:

{% highlight php linenos %}
<?php
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
{% endhighlight %}

The creation of search criteria was the easiest step in refactoring. A factory was responsible for creating the criteria and for each filter it had a dedicated method. This way, each method could have a set of unit tests, which guaranteed that the respective methods have been implemented and the result is in line with our expectations.

We had one more contoller that still did too much to rebuild. Accordingly, the two plants were created - one for building a SearchQueryParams according to a current request; the second to build a form based on the built object SearchQueryParams. As a result, each of the factories also can have a dedicated set of tests. I wrote, "can have", because I spent most of the time on the implementation of the criteria, so I could not test other factories.

When the search engine began to work as expected, the final step in refactoring was clearing all the places where the old search filters remained.

A modified search engine always creates a complete set of filters. Before modifying the query each filter checks if all entered parameters are correct. If not, the filter is ignored.

{% highlight php linenos %}
<?php
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
{% endhighlight %}

With the refactoring we were able to get rid of the technological debt, which in the future could stop us and the project would cease to develop, and working on it would become difficult. By the way, we were able to gain additional values:

Controller only accepts requests and gives back the response,
Dedicated factory for building the SearchQueryParams,
Dedicated factory for building the form.
How did we come up with the idea of this kind of refactoring? I was inspired by the article „Using Repository Pattern in Laravel 5" by Mirza Pasic.

#### Update
I know that I made a mistake in the code above. The repositories should be seen as a collection (repositories shouldn't have a state). So, SearchRepository shouldn't have the $criteria property. The methods applyCriteria and pushCriterion also should be removed. In result, the method getItems requires one parameter - CriteriaCollection. This collection contains all created criteria.

In the previous solution, the criteria were built and appended to SearchRepository. Now, the criteria are appended to the collection (CriteriaCollection). Based on this collection, I can download particular items.

{% highlight php linenos %}
<?php
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
{% endhighlight %}

Method `SearchRepository::getItems()` looks like:

{% highlight php linenos %}
<?php
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
{% endhighlight %}
