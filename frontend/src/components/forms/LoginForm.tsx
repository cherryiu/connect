import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuthHook } from '../../hooks/useAuth';
import { Formik } from 'formik';
import * as yup from 'yup';
import FormTextInput from './FormTextInput';

const LoginForm = () => {
  const { login } = useAuthHook();

  // use yup for form validation
  const loginValidationSchema = yup.object().shape({
    email: yup.string().email('Please enter a valid email').required('Email is required'),
    password: yup
      .string()
      .min(6, ({ min }) => `Password must be at least ${min} characters`)
      .required('Password is required'),
  });

  return (
    <View testID="login-form" style={styles.container}>
      {/* <Image source={logo} style={styles.logo} /> */}
      <Text style={styles.title}>Login</Text>
      <Formik
        validationSchema={loginValidationSchema}
        initialValues={{ email: '', password: '' }}
        // set submit function to call login function from useAuthHook
        onSubmit={async (values, { setSubmitting, setStatus }) => {
          try {
            setStatus(undefined);
            await login(values.email, values.password);
          } catch (error) {
            console.error('Login failed:', error);
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
          <>
            {status && <Text style={styles.errorText}>{status}</Text>}
            <FormTextInput
              title="Email"
              placeholder="Email"
              value={values.email}
              onChangeText={handleChange('email')}
              onBlur={handleBlur('email')}
              error={errors.email}
              touched={touched.email}
              keyboardType="email-address"
            />
            <FormTextInput
              title="Password"
              placeholder="Password"
              value={values.password}
              onChangeText={handleChange('password')}
              onBlur={handleBlur('password')}
              error={errors.password}
              touched={touched.password}
              secureTextEntry
            />

            {/* change button styles based on form state */}
            <TouchableOpacity
              style={[styles.button, (!isValid || isSubmitting) && styles.buttonDisabled]}
              onPress={() => handleSubmit()}
              disabled={!isValid || isSubmitting}
            >
              <Text style={styles.buttonText}>{isSubmitting ? 'Logging in...' : 'Login'}</Text>
            </TouchableOpacity>
          </>
        )}
      </Formik>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  logo: {
    height: 200,
    width: 200,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    marginBottom: 40,
    fontWeight: 'bold',
    color: 'black',
  },
  icon: {
    marginRight: 10,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#1E90FF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  errorText: {
    color: 'red',
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
});

export default LoginForm;
