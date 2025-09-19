"""
Pydantic compatibility patch for Python 3.12+
"""
import sys
from typing import ForwardRef

def patch_pydantic_forward_ref():
    """
    Monkey patch to fix Pydantic 1.10.14 compatibility with Python 3.12+
    
    The issue is that ForwardRef._evaluate() in Python 3.12 requires a 
    'recursive_guard' parameter that Pydantic 1.10.14 doesn't provide.
    """
    if sys.version_info >= (3, 12):
        try:
            import pydantic.typing
            
            # Store the original evaluate_forwardref function
            original_evaluate_forwardref = pydantic.typing.evaluate_forwardref
            
            def patched_evaluate_forwardref(type_, globalns, localns):
                """
                Patched version that handles the recursive_guard parameter for Python 3.12+
                """
                if isinstance(type_, ForwardRef):
                    if sys.version_info >= (3, 12):
                        # Python 3.12+ requires recursive_guard parameter
                        return type_._evaluate(globalns, localns, recursive_guard=set())
                    else:
                        # Python < 3.12
                        return type_._evaluate(globalns, localns)
                return type_
            
            # Apply the monkey patch
            pydantic.typing.evaluate_forwardref = patched_evaluate_forwardref
            
        except (ImportError, AttributeError):
            # If pydantic is not available or structure changed, silently pass
            pass

# Apply the patch when module is imported
patch_pydantic_forward_ref()