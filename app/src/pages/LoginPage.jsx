import { GoogleLogin } from '../components/auth/GoogleLogin';
import { useAuth } from '../hooks/useAuth';

export function Login() {
  const { login } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-blue-600">
          Income and Expenditure Control
        </h1>
        <div className="flex justify-center">
          <GoogleLogin onSuccess={login} />
        </div>
      </div>
    </div>
  );
}