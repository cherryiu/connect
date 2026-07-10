import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Formik } from 'formik';
import * as yup from 'yup';
import { useCreateUser } from '../../hooks/useCreateUser';
import FormTextInput from './FormTextInput';

export default function CreateNewUserForm() {
  const createUserValidationSchema = yup.object().shape({
    displayName: yup.string().required('Display name is required'),
    email: yup.string().email('Please enter a valid email').required('Email is required'),
    password: yup
      .string()
      .min(6, ({ min }) => `Password must be at least ${min} characters`)
      .required('Password is required'),
  });

  const { submitCreateUser } = useCreateUser();

  return (
    <View testID="create-user-form" style={styles.container}>
      <Text style={styles.title}>Create New User</Text>
      <Formik
        validationSchema={createUserValidationSchema}
        initialValues={{ displayName: '', email: '', password: '', role: 'USER' }}
        onSubmit={async (values, { setSubmitting, setStatus }) => {
          try {
            setStatus(undefined);
            await submitCreateUser(values);
          } catch (error) {
            console.error('Create user failed:', error);
            setStatus('Create user failed. Please check your input and try again.');
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
              title="Display Name"
              placeholder="john doe"
              value={values.displayName}
              onChangeText={handleChange('displayName')}
              onBlur={handleBlur('displayName')}
              error={errors.displayName}
              touched={touched.displayName}
            />
            <FormTextInput
              title="Email"
              placeholder="example@gmail.com"
              value={values.email}
              onChangeText={handleChange('email')}
              onBlur={handleBlur('email')}
              error={errors.email}
              touched={touched.email}
              keyboardType="email-address"
            />
            <FormTextInput
              title="Password"
              placeholder="********"
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
              <Text style={styles.buttonText}>{isSubmitting ? 'Submitting...' : 'Sign Up!'}</Text>
            </TouchableOpacity>
          </>
        )}
      </Formik>
    </View>
  );
}

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
