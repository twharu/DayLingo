import { render, screen } from '@testing-library/react';
import Home from '../page';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: any }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock('@/lib/firebase', () => ({
  db: {},
}));

describe('Home page', () => {
  it('renders title and button', () => {
    render(<Home />);
    expect(
      screen.getByText('日本留學生活日語學習')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /生成日語學習內容/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '📚 單字庫' })
    ).toHaveAttribute('href', '/vocabulary');
  });
});



