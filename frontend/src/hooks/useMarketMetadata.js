import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_BASE_URL, FALLBACK_CITY_METADATA } from "../data/marketData";

export const useMarketMetadata = () => {
  const [metadata, setMetadata] = useState(FALLBACK_CITY_METADATA);
  const [status, setStatus] = useState("fallback");

  useEffect(() => {
    let active = true;

    axios
      .get(`${API_BASE_URL}/metadata`, { timeout: 3500 })
      .then((res) => {
        if (!active || !Array.isArray(res.data) || res.data.length === 0) return;
        setMetadata(res.data);
        setStatus("live");
      })
      .catch(() => {
        if (active) setStatus("fallback");
      });

    return () => {
      active = false;
    };
  }, []);

  return useMemo(() => ({ metadata, status }), [metadata, status]);
};
