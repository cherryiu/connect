import { Formik } from 'formik';
import * as yup from 'yup';

import { createUser, type UserProfileRequest } from '../../api/usersApi';
import AuthFormContainer from './AuthFormContainer';
import FormTextInput from './FormTextInput';

type Props = {
  onBackToLogin: () => void;
  onCreated: (email: string) => void;
};

const initialValues: UserProfileRequest = {
  avatarUrl: '',
  bio: '',
  displayName: '',
  email: '',
  password: '',
  role: 'USER',
};

const createUserValidationSchema = yup.object({
  avatarUrl: yup.string().url('Enter a valid avatar URL.'),
  bio: yup.string().max(500, 'Bio must be 500 characters or fewer.'),
  displayName: yup.string().trim().required('Display name is required.'),
  email: yup.string().trim().email('Enter a valid email.').required('Email is required.'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters.')
    .required('Password is required.'),
  role: yup.string().oneOf(['USER']).required(),
});

export default function CreateNewUserForm({ onBackToLogin, onCreated }: Props) {
  return (
    <Formik<UserProfileRequest>
      initialValues={initialValues}
      validateOnMount
      validationSchema={createUserValidationSchema}
      onSubmit={async (values, { setSubmitting, setStatus }) => {
        try {
          setStatus(undefined);
          await createUser({
            ...values,
            avatarUrl: values.avatarUrl?.trim() || undefined,
            bio: values.bio?.trim() || undefined,
            displayName: values.displayName.trim(),
            email: values.email.trim(),
            role: 'USER',
          });
          onCreated(values.email.trim());
        } catch {
          setStatus('Account creation failed. Check your information and try again.');
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({
        errors,
        handleBlur,
        handleChange,
        handleSubmit,
        isSubmitting,
        isValid,
        status,
        touched,
        values,
      }) => (
        <AuthFormContainer
          error={status}
          isSubmitDisabled={!isValid}
          isSubmitting={isSubmitting}
          onSubmit={() => handleSubmit()}
          onSwitch={onBackToLogin}
          submitLabel="CREATE ACCOUNT"
          submittingLabel="CREATING ACCOUNT..."
          switchLabel="Log in!"
          switchPrompt="Already have an account?"
          testID="create-user-form"
          title="get ready to hang! ᯓ★"
        >
          <FormTextInput
            title="DISPLAY NAME"
            placeholder="Display name"
            value={values.displayName}
            onChangeText={handleChange('displayName')}
            onBlur={handleBlur('displayName')}
            error={errors.displayName}
            touched={touched.displayName}
          />
          <FormTextInput
            title="EMAIL"
            placeholder="Email"
            value={values.email}
            onChangeText={handleChange('email')}
            onBlur={handleBlur('email')}
            error={errors.email}
            touched={touched.email}
            keyboardType="email-address"
            autoCapitalize="none"
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
          <FormTextInput
            title="AVATAR URL (OPTIONAL)"
            placeholder="https://example.com/avatar.jpg"
            value={values.avatarUrl}
            onChangeText={handleChange('avatarUrl')}
            onBlur={handleBlur('avatarUrl')}
            error={errors.avatarUrl}
            touched={touched.avatarUrl}
            keyboardType="url"
            autoCapitalize="none"
          />
          <FormTextInput
            title="BIO (OPTIONAL)"
            placeholder="Tell your friends about yourself"
            value={values.bio}
            onChangeText={handleChange('bio')}
            onBlur={handleBlur('bio')}
            error={errors.bio}
            touched={touched.bio}
            multiline
            numberOfLines={3}
          />
        </AuthFormContainer>
      )}
    </Formik>
  );
}
