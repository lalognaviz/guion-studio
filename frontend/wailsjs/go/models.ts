export namespace domain {
	
	export class Acto {
	    id: string;
	    orden: number;
	    nombre: string;
	    sinopsis?: string;
	    plot_point: string;
	
	    static createFrom(source: any = {}) {
	        return new Acto(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.orden = source["orden"];
	        this.nombre = source["nombre"];
	        this.sinopsis = source["sinopsis"];
	        this.plot_point = source["plot_point"];
	    }
	}
	export class Conexion {
	    id: string;
	    target_scene_id: string;
	    label?: string;
	
	    static createFrom(source: any = {}) {
	        return new Conexion(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.target_scene_id = source["target_scene_id"];
	        this.label = source["label"];
	    }
	}
	export class Escena {
	    id: string;
	    act_id: string;
	    orden: number;
	    titulo: string;
	    estado: string;
	    descripcion: string;
	    escaleta: string;
	    diseno_nivel?: string;
	    sonido?: string;
	    texto_juego?: string;
	    dialogos?: string;
	    conexiones?: Conexion[];
	
	    static createFrom(source: any = {}) {
	        return new Escena(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.act_id = source["act_id"];
	        this.orden = source["orden"];
	        this.titulo = source["titulo"];
	        this.estado = source["estado"];
	        this.descripcion = source["descripcion"];
	        this.escaleta = source["escaleta"];
	        this.diseno_nivel = source["diseno_nivel"];
	        this.sonido = source["sonido"];
	        this.texto_juego = source["texto_juego"];
	        this.dialogos = source["dialogos"];
	        this.conexiones = this.convertValues(source["conexiones"], Conexion);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class EventoTimeline {
	    id: string;
	    orden: number;
	    titulo: string;
	    descripcion?: string;
	    escena_id?: string;
	    fecha?: string;
	
	    static createFrom(source: any = {}) {
	        return new EventoTimeline(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.orden = source["orden"];
	        this.titulo = source["titulo"];
	        this.descripcion = source["descripcion"];
	        this.escena_id = source["escena_id"];
	        this.fecha = source["fecha"];
	    }
	}
	export class Personaje {
	    id: string;
	    nombre: string;
	    descripcion?: string;
	    personalidad?: string;
	    apariencia?: string;
	    notas?: string;
	
	    static createFrom(source: any = {}) {
	        return new Personaje(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.nombre = source["nombre"];
	        this.descripcion = source["descripcion"];
	        this.personalidad = source["personalidad"];
	        this.apariencia = source["apariencia"];
	        this.notas = source["notas"];
	    }
	}
	export class Variable {
	    id: string;
	    nombre: string;
	    valor?: string;
	    tipo?: string;
	    descripcion?: string;
	
	    static createFrom(source: any = {}) {
	        return new Variable(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.nombre = source["nombre"];
	        this.valor = source["valor"];
	        this.tipo = source["tipo"];
	        this.descripcion = source["descripcion"];
	    }
	}
	export class Ubicacion {
	    id: string;
	    nombre: string;
	    descripcion?: string;
	    notas?: string;
	
	    static createFrom(source: any = {}) {
	        return new Ubicacion(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.nombre = source["nombre"];
	        this.descripcion = source["descripcion"];
	        this.notas = source["notas"];
	    }
	}
	export class Proyecto {
	    id: string;
	    title: string;
	    synopsis?: string;
	    ruta_archivo?: string;
	    acts: Acto[];
	    scenes: Escena[];
	    createdAt?: string;
	    updatedAt: string;
	    personajes?: Personaje[];
	    ubicaciones?: Ubicacion[];
	    variables?: Variable[];
	    timeline?: EventoTimeline[];
	
	    static createFrom(source: any = {}) {
	        return new Proyecto(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.title = source["title"];
	        this.synopsis = source["synopsis"];
	        this.ruta_archivo = source["ruta_archivo"];
	        this.acts = this.convertValues(source["acts"], Acto);
	        this.scenes = this.convertValues(source["scenes"], Escena);
	        this.createdAt = source["createdAt"];
	        this.updatedAt = source["updatedAt"];
	        this.personajes = this.convertValues(source["personajes"], Personaje);
	        this.ubicaciones = this.convertValues(source["ubicaciones"], Ubicacion);
	        this.variables = this.convertValues(source["variables"], Variable);
	        this.timeline = this.convertValues(source["timeline"], EventoTimeline);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ProyectoResumen {
	    id: string;
	    titulo: string;
	    ruta_archivo?: string;
	    sinopsis: string;
	    creado_en: string;
	
	    static createFrom(source: any = {}) {
	        return new ProyectoResumen(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.titulo = source["titulo"];
	        this.ruta_archivo = source["ruta_archivo"];
	        this.sinopsis = source["sinopsis"];
	        this.creado_en = source["creado_en"];
	    }
	}
	

}

