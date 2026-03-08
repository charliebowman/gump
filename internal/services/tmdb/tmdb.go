package tmdb

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"

	"github.com/charliebowman/gump/internal/models"
)

// Client uses Wikidata SPARQL endpoint for movie/TV search.
// Completely free, no API key, no signup required.
type Client struct {
	httpClient *http.Client
}

func NewClient(_ string) *Client {
	return &Client{httpClient: &http.Client{}}
}

type sparqlResponse struct {
	Results struct {
		Bindings []map[string]struct {
			Value string `json:"value"`
		} `json:"bindings"`
	} `json:"results"`
}

func (c *Client) SearchMovies(query string) ([]models.SearchResult, error) {
	return c.search("movie", query, "Q11424") // Q11424 = film
}

func (c *Client) SearchTV(query string) ([]models.SearchResult, error) {
	return c.search("tv", query, "Q5398426") // Q5398426 = television series
}

func (c *Client) search(mediaType, query, instanceOf string) ([]models.SearchResult, error) {
	sparql := fmt.Sprintf(`SELECT ?item ?itemLabel ?itemDescription ?date ?image WHERE {
  SERVICE wikibase:mwapi {
    bd:serviceParam wikibase:endpoint "www.wikidata.org";
                    wikibase:api "EntitySearch";
                    mwapi:search "%s";
                    mwapi:language "en".
    ?item wikibase:apiOutputItem mwapi:item.
  }
  ?item wdt:P31/wdt:P279* wd:%s.
  OPTIONAL { ?item wdt:P577 ?date. }
  OPTIONAL { ?item wdt:P18 ?image. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
} LIMIT 20`, query, instanceOf)

	u := "https://query.wikidata.org/sparql?format=json&query=" + url.QueryEscape(sparql)

	req, _ := http.NewRequest("GET", u, nil)
	req.Header.Set("User-Agent", "Gump/1.0 (media tracker app)")
	req.Header.Set("Accept", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("wikidata request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("wikidata returned status %d: %s", resp.StatusCode, string(body))
	}

	var sr sparqlResponse
	if err := json.Unmarshal(body, &sr); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	results := make([]models.SearchResult, 0, len(sr.Results.Bindings))
	seen := map[string]bool{}

	for _, b := range sr.Results.Bindings {
		itemURI := b["item"].Value
		if seen[itemURI] {
			continue
		}
		seen[itemURI] = true

		title := b["itemLabel"].Value
		if title == "" {
			continue
		}

		meta := map[string]interface{}{
			"description": b["itemDescription"].Value,
			"wikidata_url": itemURI,
		}
		if date, ok := b["date"]; ok && date.Value != "" {
			meta["release_date"] = date.Value[:10]
		}
		if img, ok := b["image"]; ok && img.Value != "" {
			meta["image_url"] = img.Value
		}

		metaJSON, _ := json.Marshal(meta)

		// Extract Wikidata ID from URI (e.g. http://www.wikidata.org/entity/Q12345 -> Q12345)
		externalID := itemURI
		if len(itemURI) > 31 {
			externalID = itemURI[31:]
		}

		results = append(results, models.SearchResult{
			ExternalID: externalID,
			Title:      title,
			MediaType:  mediaType,
			Metadata:   metaJSON,
		})
	}

	return results, nil
}
