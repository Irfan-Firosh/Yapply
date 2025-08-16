from db_functions.access_table import supabase


def gen_magic_link(email: str):
    try:
        res = supabase.auth.sign_in_with_otp({
            "email": email,
            "options": {
                "emailRedirectTo": "http://localhost:8080/candidate/dashboard",
                "shouldCreateUser": True
            }
        })
        return res
    except Exception as e:
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        if hasattr(e, 'response'):
            print(f"Response status: {e.response.status_code}")
            print(f"Response content: {e.response.text}")
        raise e

if __name__ == "__main__":
    print(gen_magic_link("itsmeo9806@gmail.com"))