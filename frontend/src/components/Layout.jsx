export default function Layout({ children }) {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="site-header">
        <div className="container">
          <h1>Student Information Management System</h1>
          <p>Register, search and maintain student records.</p>
        </div>
      </header>
      <main id="main" className="container">
        {children}
      </main>
      <footer className="site-footer">
        <div className="container">Cloud Computing CA2 &middot; React + Netlify Functions + Netlify Database</div>
      </footer>
    </>
  );
}
