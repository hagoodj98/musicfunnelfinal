import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect } from 'vitest';
import ContentSection from '../../components/ContentSection';
import React from 'react';

describe('ContentSection', () => {
  it('renders section content', () => {
    render(
      <ContentSection>
        <div data-testid="content-section">Hello</div>
      </ContentSection>
    );
    expect(screen.getByTestId('content-section')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
