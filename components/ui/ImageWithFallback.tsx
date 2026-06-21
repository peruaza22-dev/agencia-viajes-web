"use client";

import React, { useState } from 'react';

type Props = {
  src?: string | null;
  alt?: string;
  className?: string;
  fallback?: string;
};

export default function ImageWithFallback({ src, alt = '', className, fallback = '/img/about-01.jpg' }: Props) {
  const [current, setCurrent] = useState<string>(src || fallback);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={current}
      alt={alt}
      className={className}
      onError={() => setCurrent(fallback)}
    />
  );
}
