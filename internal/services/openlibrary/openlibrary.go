package openlibrary

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"

	"github.com/charliebowman/gump/internal/models"
)

type Client struct {
	httpClient *http.Client
}

func NewClient() *Client {
	return &Client{httpClient: &http.Client{}}
}

type searchResponse struct {
	Docs []olDoc `json:"docs"`
}

type olDoc struct {
	Key            string   `json:"key"`
	Title          string   `json:"title"`
	AuthorName     []string `json:"author_name"`
	FirstPublishYear int    `json:"first_publish_year"`
	CoverI         int      `json:"cover_i"`
	ISBN           []string `json:"isbn"`
	NumberOfPages  int      `json:"number_of_pages_median"`
	Subject        []string `json:"subject"`
}

func (c *Client) SearchBooks(query string) ([]models.SearchResult, error) {
	u := fmt.Sprintf("https://openlibrary.org/search.json?q=%s&limit=20", url.QueryEscape(query))

	resp, err := c.httpClient.Get(u)
	if err != nil {
		return nil, fmt.Errorf("openlibrary request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("openlibrary returned status %d", resp.StatusCode)
	}

	var sr searchResponse
	if err := json.Unmarshal(body, &sr); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	results := make([]models.SearchResult, 0, len(sr.Docs))
	for _, d := range sr.Docs {
		authors := ""
		if len(d.AuthorName) > 0 {
			authors = d.AuthorName[0]
		}

		coverURL := ""
		if d.CoverI > 0 {
			coverURL = fmt.Sprintf("https://covers.openlibrary.org/b/id/%d-M.jpg", d.CoverI)
		}

		meta := map[string]interface{}{
			"author":             authors,
			"first_publish_year": d.FirstPublishYear,
			"cover_url":          coverURL,
			"number_of_pages":    d.NumberOfPages,
		}
		if len(d.Subject) > 5 {
			meta["subjects"] = d.Subject[:5]
		} else if len(d.Subject) > 0 {
			meta["subjects"] = d.Subject
		}

		metaJSON, _ := json.Marshal(meta)

		results = append(results, models.SearchResult{
			ExternalID: d.Key,
			Title:      d.Title,
			MediaType:  "book",
			Metadata:   metaJSON,
		})
	}

	return results, nil
}
