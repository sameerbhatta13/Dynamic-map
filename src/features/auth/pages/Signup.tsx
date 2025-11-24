import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';

// Define the form schema with validation
const signupSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters long'),
    email: z.email('Please enter a valid email address'),
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<SignupFormData>({
        resolver: zodResolver(signupSchema),
    });

    const onSubmit = async (data: SignupFormData) => {
        try {
            setIsSubmitting(true);
            setSubmitMessage(null);

            // Here you would typically make an API call to your backend
            console.log('Submitting email:', data.email);
            
            // Simulate API call
            const response = await Promise.all(
                [axios.post(`${import.meta.env.VITE_API_URL}/auth/sign-in/magic-link`, data),
                axios.get(`${import.meta.env.VITE_API_URL}/auth/get-session`)]
            );
            console.log(response[0].data);
            console.log(response[1].data);
            //   await new Promise(resolve => setTimeout(resolve, 1000));

            setSubmitMessage({
                type: 'success',
                message: 'Thank you for signing up! Please check your email to confirm your subscription.',
            });
            reset();
        } catch (error) {
            setSubmitMessage({
                type: 'error',
                message: 'An error occurred. Please try again later.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Sign up for updates
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Enter your email to stay updated with our latest news and features.
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="email-address" className="sr-only">
                                Name
                            </label>
                            <input
                                id="name"
                                type="name"
                                autoComplete="name"
                                className={`appearance-none rounded-none relative block w-full px-2 py-2  border ${errors.email ? 'border-red-300' : 'border-gray-300'
                                    } placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                                placeholder="Name"
                                {...register('name')}
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600">{errors?.name?.message}</p>
                            )}
                        </div>
                    </div>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="email-address" className="sr-only">
                                email
                            </label>
                            <input
                                id="email"
                                type="email"
                                autoComplete="email"
                                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${errors.email ? 'border-red-300' : 'border-gray-300'
                                    } placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                                placeholder="Email address"
                                {...register('email')}
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                            )}
                        </div>
                    </div>

                    {submitMessage && (
                        <div className={`rounded-md p-4 ${submitMessage.type === 'success' ? 'bg-green-50' : 'bg-red-50'}`}>
                            <p className={`text-sm ${submitMessage.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                                {submitMessage.message}
                            </p>
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Signing up...' : 'Sign up'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
