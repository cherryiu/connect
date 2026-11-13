import { useAuthHook } from '../../hooks/useAuth';
import { Formik } from 'formik';
import * as yup from 'yup';
import FormTextInput from './FormTextInput';
import AuthFormContainer from './AuthFormContainer';

const loginValidationSchema = yup.object({
  email: yup.string().email('Please enter a valid email').required('Email is required'),
  password: yup
    .string()
    .min(6, ({ min }) => `Password must be at least ${min} characters`)
    .required('Password is required'),
});

type Props = {
  initialEmail?: string;
  onCreateAccount?: () => void;
  successMessage?: string;
};

const LoginForm = ({
  initialEmail = '',
  onCreateAccount = () => undefined,
  successMessage,
}: Props) => {
  const { login } = useAuthHook();

  return (
    <Formik
      enableReinitialize
      initialValues={{ email: initialEmail, password: '' }}
      validateOnMount
      validationSchema={loginValidationSchema}
      onSubmit={async (values, { setSubmitting, setStatus }) => {
        try {
          setStatus(undefined);
          await login(values.email, values.password);
        } catch {
          setStatus('Login failed. Please check your credentials and try again.');
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({
        handleChange,
        handleBlur,
        handleSubmit,
        values,
        errors,
        touched,
        isValid,
        isSubmitting,
        status,
      }) => (
        <AuthFormContainer
          error={status}
          isSubmitDisabled={!isValid}
          isSubmitting={isSubmitting}
          onSubmit={() => handleSubmit()}
          onSwitch={onCreateAccount}
          submitLabel="LOGIN"
          submittingLabel="LOGGING IN..."
          success={successMessage}
          switchLabel="Create one!"
          switchPrompt="Don't have an account?"
          testID="login-form"
          title="welcome! ッ"
        >
          <FormTextInput
            title="EMAIL"
            placeholder="Email"
            value={values.email}
            onChangeText={handleChange('email')}
            onBlur={handleBlur('email')}
            error={errors.email}
            touched={touched.email}
            keyboardType="email-address"
          />
          <FormTextInput
            title="PASSWORD"
            placeholder="Password"
            value={values.password}
            onChangeText={handleChange('password')}
            onBlur={handleBlur('password')}
            error={errors.password}
            touched={touched.password}
            secureTextEntry
          />
        </AuthFormContainer>
      )}
    </Formik>
  );
};

export default LoginForm;
