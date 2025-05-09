import React, { useEffect, useState } from "react";

const MealImage = ({ query }) => {
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const res = await fetch(
          `https://api.unsplash.com/search/photos?query=${query}&client_id=kvt18CAJgx7LXUFaritX7Ditt8NXUDqZFsErz7vdGHE`
        );
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          setImageUrl(data.results[0].urls.small);
        }
      } catch (error) {
        console.error("Image fetch failed:", error);
      }
    };

    fetchImage();
  }, [query]);

  return (
    <div className="mb-3 text-center">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={query}
          className="img-fluid rounded shadow-sm"
          style={{ maxHeight: "200px", objectFit: "cover" }}
        />
      ) : (
        <p>Loading image...</p>
      )}
    </div>
  );
};

export default MealImage;
