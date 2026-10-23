require "erb"; require "json"; require "base64"
def base64_encode(t); Base64.strict_encode64(t); end
def vm_context; {}; end
def vm_object(n, o = {}); o.merge("system_name"=>n).to_json; end
def flags_for_vm(vm, flags = []); flags.to_json; end
def vm_flags_json(vm, flags = []); flags.to_json; end
src, out = ARGV
File.write(out, JSON.pretty_generate(JSON.parse(ERB.new(File.read(src), trim_mode: "-").result(binding))))
