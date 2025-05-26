const Navbar = () => {
  return (
    <nav className="p-4 border-b">
      <div className="flex justify-between items-center">
        <div className="text-lg font-medium">InfoPulse</div>
        <ul className="flex space-x-6">
          <li><a href="/">Home</a></li>
          <li><a href="/explore">Explore</a></li>
          <li><a href="/favorite">Login</a></li>
          <li><a href="/profile">Register</a></li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;