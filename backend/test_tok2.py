import sys
try:
    from transformers import AutoTokenizer
    # A valid public repo that is not a model (a space or dataset)
    AutoTokenizer.from_pretrained('tiiuae/falcon-40b', token='hf_invalid_or_valid')
except Exception as e:
    print("EXCEPTION:", repr(e))
    print("STRING:", str(e).lower())
